import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model, Types } from 'mongoose';
import { Role } from '../users/schemas/user.schema';
import { RefreshTokenDocument } from './schemas/refresh-token.schema';

@Injectable()
export class RefreshTokensService {
  constructor(
    private jwtService: JwtService,
    @InjectModel('RefreshToken')
    private refreshTokenModel: Model<RefreshTokenDocument>,
  ) {}

  async generateRefreshToken(
    email: string,
    role: Role,
    id: Types.ObjectId,
  ): Promise<{ refreshToken: string }> {
    const payload = { sub: id, email };

    console.log('I want to generate refresh token');

    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: '7d',
    });

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 12);

    const expire = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.refreshTokenModel.findOneAndDelete({
      userId: id,
    });

    await new this.refreshTokenModel({
      token: hashedRefreshToken,
      userId: id,
      role,
      expiresAt: expire,
    }).save();

    return { refreshToken };
  }
  async findRefreshTokenByUserId(
    id: Types.ObjectId,
  ): Promise<RefreshTokenDocument> {
    const refreshTokenExist = await this.refreshTokenModel.findOne({
      userId: id,
    });

    if (!refreshTokenExist) {
      throw new NotFoundException({
        message: 'Refresh token not found or has expired.',
        status: 404,
        success: false,
      });
    }

    return refreshTokenExist;
  }

  async deleteRefreshToken(refreshToken: string, userId: Types.ObjectId) {
    const refreshTokenExist = await this.refreshTokenModel.findOne({
      userId,
    });

    if (!refreshTokenExist) {
      return 'Token deleted successfully';
    }

    const compare = await bcrypt.compare(
      refreshToken,
      refreshTokenExist?.token,
    );

    if (!compare) {
      throw new UnauthorizedException({
        message: 'Invalid token',
        success: false,
        status: 401,
      });
    }

    await this.refreshTokenModel.findByIdAndDelete(refreshTokenExist._id);

    return 'Token deleted successfully';
  }
}
