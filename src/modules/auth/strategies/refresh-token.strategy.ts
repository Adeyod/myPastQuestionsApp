import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import * as bcrypt from 'bcrypt';
import { Request } from 'express';
import { Types } from 'mongoose';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { RefreshTokensService } from '../../../modules/refresh-tokens/refresh-tokens.service';
import { UsersService } from '../../../modules/users/users.service';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
    private refreshTokensService: RefreshTokensService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('envValues.refreshToken'),
      passReqToCallback: true, // this is what give us access to the full http request which allow us to use req: Request in validate function
    });
  }

  async validate(
    req: Request,
    payload: { sub: string; email: string; sessionId: string },
  ) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Refresh token not provided.');
    }

    const refreshToken = authHeader.replace('Bearer', '').trim();

    if (!refreshToken) {
      throw new UnauthorizedException(
        'Refresh token is empty after extraction.',
      );
    }

    const id = new Types.ObjectId(payload.sub);

    console.log('id:', id);

    const user = await this.usersService.findUserById(id);

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const getUserRefreshToken =
      await this.refreshTokensService.findRefreshTokenByUserId(user._id);

    if (!getUserRefreshToken || !getUserRefreshToken.token) {
      throw new UnauthorizedException({
        message: 'Invalid refresh token',
        success: false,
        status: 401,
      });
    }

    const compareToken = await bcrypt.compare(
      refreshToken,
      getUserRefreshToken.token,
    );

    if (!compareToken) {
      throw new UnauthorizedException({
        message: 'Invalid refresh token',
        success: false,
        status: 401,
      });
    }

    console.log('users:', user);

    return {
      sub: user._id,
      email: user.email,
      role: user.role,
      plans: user.plans,
    };
  }
}
