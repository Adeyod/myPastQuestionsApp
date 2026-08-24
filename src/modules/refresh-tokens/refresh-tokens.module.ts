import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { RefreshTokensController } from './refresh-tokens.controller';
import { RefreshTokensService } from './refresh-tokens.service';
import { RefreshTokensRepository } from './repositories/refresh-tokens.repository';
import {
  RefreshToken,
  RefreshTokenSchema,
} from './schemas/refresh-token.schema';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        signOptions: {
          expiresIn: Number(
            configService.getOrThrow<number>('JWT_REFRESH_EXPIRES_IN'),
          ),
        },
      }),
    }),
    MongooseModule.forFeature([
      { name: RefreshToken.name, schema: RefreshTokenSchema },
    ]),
  ],
  controllers: [RefreshTokensController],
  providers: [RefreshTokensService, RefreshTokensRepository],
  exports: [RefreshTokensService],
})
export class RefreshTokensModule {}
