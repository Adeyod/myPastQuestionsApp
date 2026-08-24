import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Request } from 'express';
import { Model, Types } from 'mongoose';
import { JwtUser } from '../../common/types/jwt-user.type';
import { generateCode } from '../../common/utils/code';
import { addDays } from '../../common/utils/helper';
import { MailService } from '../../mail/mail.service';
import { PlanCode } from '../plans/schemas/plan.schema';
import { RefreshTokensService } from '../refresh-tokens/refresh-tokens.service';
import { TokensRepository } from '../tokens/repositories/tokens.repository';
import { TokenPurpose } from '../tokens/schemas/token.schema';
import { UserSessionDocument } from '../user-session/schemas/user-session.schema';
import { UserSessionService } from '../user-session/user-session.service';
import { UsersRepository } from '../users/repositories/users.repository';
import { WalletResponseDto } from '../wallets/dto/wallet-response.dto';
import { WalletsRepository } from '../wallets/repositories/wallets.repository';
import { AuthResponseDto } from './dto/auth-response.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { BlacklistedToken } from './schemas/black-listed-token.schema';

@Injectable()
export class AuthService {
  private readonly SALT_VALUE = 12;

  constructor(
    @InjectModel('BlacklistedToken')
    private blacklistedToken: Model<BlacklistedToken>,
    private usersRepository: UsersRepository,
    private walletsRepository: WalletsRepository,
    private jwtService: JwtService,
    private tokensRepository: TokensRepository,
    private mailService: MailService,
    private userSessionService: UserSessionService,
    private refreshTokensService: RefreshTokensService,
  ) {}
  async registerUser(registerUserDto: RegisterUserDto) {
    const { firstName, lastName, email, password, phoneNumber, referredBy } =
      registerUserDto;

    const userExist = await this.usersRepository.findByEmail(email);

    if (userExist) {
      throw new ConflictException({
        message: 'Email already in use',
        status: 409,
        success: false,
      });
    }

    const hashed = await this.passwordHashing(password.trim());

    const payload = {
      firstName: firstName.toLowerCase().trim(),
      lastName: lastName.toLowerCase().trim(),
      email: email.toLowerCase().trim(),
      phoneNumber: phoneNumber.trim(),
      password: hashed,
      referredBy: referredBy && referredBy,
    };

    const newUser = await this.usersRepository.create(payload);

    console.log('newUser:', newUser);

    const token = generateCode(6);
    const input = {
      user: newUser._id,
      purpose: TokenPurpose.EMAIL_VERIFICATION,
      token: token.toString(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    };
    const userToken = await this.tokensRepository.create(input);
    console.log('userToken:', userToken);

    const findWallet = await this.walletsRepository.findWalletByUserId(
      newUser._id.toString(),
    );
    console.log('findWallet:', findWallet);

    if (!findWallet) {
      const newWallet = await this.walletsRepository.createWallet(
        newUser._id.toString(),
      );
      console.log('newWallet:', newWallet);
    }

    const mailResponse = await this.mailService.sendVerificationEmail(
      newUser.email,
      newUser.firstName,
      userToken.token,
    );
    console.log('mailResponse:', mailResponse);

    return {
      data: null,
      message: `${newUser.firstName} ${newUser.lastName}, your registration is successful, kindly check your email to proceed.`,
    };
  }

  async verifyUserEmail(token: string) {
    const purpose = TokenPurpose.EMAIL_VERIFICATION;
    const tokenExist = await this.tokensRepository.findOne(token, purpose);

    if (!tokenExist) {
      throw new NotFoundException({
        message:
          'Token does not exist or verification token has expired. You can request for another one',
        status: 404,
        success: false,
      });
    }

    const userExist = await this.usersRepository.findById(tokenExist.user);

    if (!userExist) {
      throw new NotFoundException({
        message: 'User not found.',
        status: 404,
        success: false,
      });
    }

    const verify = await this.usersRepository.update(userExist._id, {
      isVerified: true,
    });

    if (!verify) {
      throw new BadRequestException({
        message: 'Unable to verify user',
        status: 400,
        success: false,
      });
    }

    await this.tokensRepository.delete(tokenExist._id);

    return {
      message: 'Email verification successful',
    };
  }

  async forceSwitch(dto: LoginDto): Promise<AuthResponseDto> {
    const { email, password, deviceId, deviceName } = dto;

    const user = await this.usersRepository.findByEmail(email);

    if (!user || user === null) {
      throw new UnauthorizedException({
        message: 'Invalid credentials.',
        status: 401,
        success: false,
      });
    }

    const hash = user?.password;

    if (!hash) {
      throw new UnauthorizedException({
        message: 'Invalid credentials',
        success: false,
        status: 401,
      });
    }

    const passwordMatch = await this.comaparePassword(password, hash);

    if (passwordMatch !== true) {
      throw new UnauthorizedException({
        message: 'Invalid credentials.',
        status: 401,
        success: false,
      });
    }

    if (user.isVerified !== true) {
      throw new BadRequestException({
        message: 'This endpoint is for verified email address.',
        success: false,
        status: 400,
      });
    }

    const now = new Date();

    if (user.lastForcedSwitchAt) {
      const lastSwitch = user.lastForcedSwitchAt;

      const nextAllowedSwitchDate = addDays(lastSwitch, 90);

      // I will add this back after all testing has been done to prevent switching more than ones in 90 days
      // if (new Date() < nextAllowedSwitchDate) {
      //   throw new ForbiddenException({
      //     message: `You can switch again on ${nextAllowedSwitchDate.toDateString()}`,
      //     success: false,
      //     status: 403,
      //   });
      // }
    }

    const payload = {
      userId: user._id.toString(),
      deviceId,
      deviceName,
    };

    const newSession = await this.userSessionService.forceSwitch(payload);

    const refreshToken = await this.refreshTokensService.generateRefreshToken(
      user.email,
      user.role,
      user._id,
    );
    const accessToken = await this.generateAccessTokens(
      user.email,
      user._id,
      user.role,
      user.plans,
    );

    let userWallet: WalletResponseDto | null;

    userWallet = await this.walletsRepository.findWalletByUserId(
      user._id.toString(),
    );

    if (!userWallet) {
      userWallet = await this.walletsRepository.createWallet(
        user._id.toString(),
      );
    }

    const { password: _password, ...others } = user.toObject();

    user.lastForcedSwitchAt = new Date();
    await user.save();

    const session = newSession;
    return {
      refreshToken: refreshToken.refreshToken,
      accessToken,
      session,
      user: {
        userWallet,
        ...others,
      },
    };
  }

  async loginUser(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password, deviceId, deviceName } = loginDto;

    console.log('loginDto:', loginDto);

    const user = await this.usersRepository.findByEmail(email);

    if (!user || user === null) {
      throw new UnauthorizedException({
        message: 'Invalid credentials.',
        status: 401,
        success: false,
      });
    }

    const hash = user?.password;

    if (!hash) {
      throw new UnauthorizedException({
        message: 'Invalid credentials',
        success: false,
        status: 401,
      });
    }
    const passwordMatch = await this.comaparePassword(password, hash);

    if (passwordMatch !== true) {
      throw new UnauthorizedException({
        message: 'Invalid credentials.',
        status: 401,
        success: false,
      });
    }

    if (user.isVerified !== true) {
      const tokenNum = generateCode(6);
      const purpose = TokenPurpose.EMAIL_VERIFICATION;
      const input = {
        user: user._id,
        purpose,
        token: tokenNum.toString(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      };
      const token =
        (await this.tokensRepository.findOneByUserIdAndPurpose(
          user._id,
          purpose,
        )) ?? (await this.tokensRepository.create(input));

      await this.mailService.sendVerificationEmail(
        user.email,
        user.firstName,
        token.token,
      );

      throw new UnauthorizedException({
        message: `${user.firstName} ${user.lastName}, Please verify your email to proceed.`,
        status: 401,
        success: false,
      });
    } else {
      const userId = user._id.toString();

      let session: UserSessionDocument;
      const role = user.role;

      try {
        session = await this.userSessionService.handleLogin({
          userId,
          deviceId,
          deviceName,
          role,
        });
      } catch (err) {
        if (err instanceof ConflictException) {
          throw err; // send FORCE_SWITCH_REQUIRED to frontend
        }
        throw err;
      }

      // generate tokens

      const refreshToken = await this.refreshTokensService.generateRefreshToken(
        user.email,
        user.role,
        user._id,
      );
      const accessToken = await this.generateAccessTokens(
        user.email,
        user._id,
        user.role,
        user.plans,
      );

      let userWallet: WalletResponseDto | null;

      userWallet = await this.walletsRepository.findWalletByUserId(
        user._id.toString(),
      );

      if (!userWallet) {
        userWallet = await this.walletsRepository.createWallet(
          user._id.toString(),
        );
      }

      const { password, ...others } = user.toObject();

      return {
        refreshToken: refreshToken.refreshToken,
        accessToken,
        session,
        user: {
          userWallet,
          ...others,
        },
      };
    }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    const user = await this.usersRepository.findByEmail(email);

    if (!user) {
      throw new NotFoundException({
        message: 'User not found',
        success: false,
        status: 404,
      });
    }

    let realToken: string;

    const purpose = TokenPurpose.PASSWORD_RESET;
    const checkTokenExist =
      await this.tokensRepository.findOneByUserIdAndPurpose(user._id, purpose);

    if (checkTokenExist) {
      realToken = checkTokenExist.token;
    } else {
      const token = generateCode(6);

      const input = {
        user: user._id,
        purpose,
        token: token.toString(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      };

      const newToken = await this.tokensRepository.create(input);

      if (!newToken) {
        throw new BadRequestException({
          message: 'Unable to create token',
          status: 400,
          success: false,
        });
      }

      realToken = newToken.token;
    }

    await this.mailService.sendPasswordReset(
      user.email,
      user.firstName,
      realToken,
    );

    // return {
    //   message: 'Please check your email for password reset pin',
    // };
  }
  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    const { token, password } = resetPasswordDto;

    const purpose = TokenPurpose.PASSWORD_RESET;
    const findToken = await this.tokensRepository.findOne(token, purpose);

    if (!findToken) {
      throw new NotFoundException({
        message: 'Token not found or token has expired.',
        success: false,
        status: 404,
      });
    }

    const hashedPassword = await this.passwordHashing(password);

    const user = await this.usersRepository.update(findToken.user, {
      password: hashedPassword,
    });

    if (!user) {
      throw new BadRequestException({
        message: 'Unable to change password',
        success: false,
        status: 400,
      });
    }

    return {
      message: 'Password changed successfully.',
    };
  }
  async requestAccessToken(user: {
    sub: Types.ObjectId;
    email: string;
    role: string;
    plans: PlanCode[];
  }) {
    const { email, sub, role, plans } = user;

    console.log('requestAccessToken user:', user);
    const accessToken = this.generateAccessTokens(email, sub, role, plans);

    return accessToken;
  }
  async resendEmailVerificationToken(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    const { email } = forgotPasswordDto;

    const userExist = await this.usersRepository.findByEmail(email);

    if (!userExist) {
      throw new NotFoundException({
        message: 'User not found',
        status: 404,
        success: false,
      });
    }

    if (userExist.isVerified) {
      throw new UnauthorizedException({
        message: 'User already verified',
        status: 401,
        success: false,
      });
    }

    const tokenNum = generateCode(6);
    const purpose = TokenPurpose.EMAIL_VERIFICATION;
    const input = {
      user: userExist._id,
      purpose,
      token: tokenNum.toString(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    };
    const token =
      (await this.tokensRepository.findOneByUserIdAndPurpose(
        userExist._id,
        purpose,
      )) ?? (await this.tokensRepository.create(input));

    await this.mailService.sendVerificationEmail(
      userExist.email,
      userExist.firstName,
      token.token,
    );

    return {
      message: `${userExist.firstName} ${userExist.lastName}, Please verify your email to proceed.`,
    };
  }
  async logoutUser(req: Request, user: JwtUser) {
    const accessToken = req.headers.authorization
      ?.replace('Bearer', '')
      .trim() as string;
    const refreshToken = req.headers['x-refresh-token'] as string;

    console.log('logout user:', accessToken);
    const deleteRefreshToken =
      await this.refreshTokensService.deleteRefreshToken(
        refreshToken,
        user.sub,
      );

    const decoded = this.jwtService.decode(accessToken);

    if (!decoded?.exp) {
      throw new UnauthorizedException('Invalid access token');
    }
    const expiresAt = new Date(decoded.exp * 1000);

    await new this.blacklistedToken({
      token: accessToken,
      expiresAt,
    }).save();

    return { message: 'User logged out successfully.' };
  }

  private async comaparePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    const compare = await bcrypt.compare(password, hashedPassword);
    return compare;
  }

  private async passwordHashing(password: string): Promise<string> {
    const hash = await bcrypt.hash(password, this.SALT_VALUE);

    return hash;
  }

  private async generateAccessTokens(
    email: string,
    id: Types.ObjectId,
    role: string,
    plans: PlanCode[],
  ) {
    const payload = { sub: id, email, role, plans };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: process.env.NODE_ENV === 'production' ? '15m' : '3d',
    });

    return accessToken;
  }
}
