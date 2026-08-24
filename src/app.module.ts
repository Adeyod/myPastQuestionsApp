import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import Joi from 'joi';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './config/configuration';
import { MailModule } from './mail/mail.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { AuthModule } from './modules/auth/auth.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { QuestionsInjectionModule } from './modules/questions-injection/questions-injection.module';
import { QuestionsModule } from './modules/questions/questions.module';
import { RefreshTokensModule } from './modules/refresh-tokens/refresh-tokens.module';
import { SubjectsModule } from './modules/subjects/subjects.module';
import { TokensModule } from './modules/tokens/tokens.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { UsersModule } from './modules/users/users.module';
import { WalletsModule } from './modules/wallets/wallets.module';
import { ReferralsModule } from './modules/referrals/referrals.module';
import { WithdrawalsModule } from './modules/withdrawals/withdrawals.module';
import { PaymentGatewayModule } from './modules/payment-gateway/payment-gateway.module';
import { UserSessionModule } from './modules/user-session/user-session.module';
import { SocketModule } from './modules/socket/socket.module';
import { PlansModule } from './modules/plans/plans.module';
import { CompanyWalletModule } from './modules/company-wallet/company-wallet.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: Joi.object({
        JWT_SECRET: Joi.string().required(),
        JWT_REFRESH_SECRET: Joi.string().required(),
        JWT_EXPIRES_IN: Joi.string().required(),
        MONGO_URI: Joi.string().required(),
      }),
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>('MONGO_URI'),

        connectionFactory: (connection) => {
          if (connection.readyState === 1) {
            console.log(`MongoDB connected to database: ${connection.name}`);
          }

          connection.on('reconnected', () => {
            console.log('🔄 MongoDB reconnected...');
          });

          connection.on('error', (error) => {
            console.error('MongoDB connection error:', error);
          });

          connection.on('disconnected', () => {
            console.warn('MongoDB disconnected');
          });

          return connection;
        },
      }),
    }),

    // BullModule.forRootAsync({
    //   inject: [ConfigService],

    //   useFactory: (configService: ConfigService) => {
    //     const redisUrl = configService.getOrThrow<string>('REDIS_URL');

    //     console.log('redisUrl:', redisUrl);

    //     if (redisUrl && !redisUrl.includes('localhost')) {
    //       console.log('Redis does not include localhost');
    //       return {
    //         redis: {
    //           url: redisUrl,
    //           maxRetriesPerRequest: null,
    //         },
    //       };
    //     }

    //     console.log('This is localhost redis');
    //     return {
    //       redis: {
    //         host: 'localhost',
    //         port: 6379,
    //       },
    //     };
    //   },
    // }),

    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');

        if (redisUrl) {
          const redisArray = redisUrl.split(':');

          const url = new URL(redisUrl);
          return {
            redis: {
              host: url.hostname,
              port: Number(url.port),
              maxRetriesPerRequest: null,
            },
          };
        }

        return {
          redis: {
            host: '127.0.0.1',
            port: 6379,
          },
        };
      },
    }),
    MailModule,
    AuthModule,
    TokensModule,
    UsersModule,
    RefreshTokensModule,
    SubjectsModule,
    QuestionsModule,
    QuestionsInjectionModule,
    PaymentsModule,
    WalletsModule,
    TransactionsModule,
    AccountsModule,
    ReferralsModule,
    WithdrawalsModule,
    PaymentGatewayModule,
    UserSessionModule,
    SocketModule,
    PlansModule,
    CompanyWalletModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
