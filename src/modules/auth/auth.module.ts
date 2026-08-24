import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { MailModule } from '../../mail/mail.module';
import { RefreshTokensModule } from '../refresh-tokens/refresh-tokens.module';
import { TokensModule } from '../tokens/tokens.module';
import { UserSessionModule } from '../user-session/user-session.module';
import { UsersModule } from '../users/users.module';
import { WalletsModule } from '../wallets/wallets.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import {
  BlacklistedToken,
  BlacklistedTokenSchema,
} from './schemas/black-listed-token.schema';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: Number(configService.getOrThrow<number>('JWT_EXPIRES_IN')),
        },
      }),
    }),
    MongooseModule.forFeature([
      { name: BlacklistedToken.name, schema: BlacklistedTokenSchema },
    ]),
    TokensModule,
    UsersModule,
    MailModule,
    UserSessionModule,
    RefreshTokensModule,
    WalletsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RefreshTokenStrategy],
})
export class AuthModule {}
