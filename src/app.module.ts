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
import { CompanyWalletModule } from './modules/company-wallet/company-wallet.module';
import { PaymentGatewayModule } from './modules/payment-gateway/payment-gateway.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { PinsModule } from './modules/pins/pins.module';
import { PlansModule } from './modules/plans/plans.module';
import { PracticeWalletModule } from './modules/practice-wallet/practice-wallet.module';
import { PracticeModule } from './modules/practice/practice.module';
import { QuestionsInjectionModule } from './modules/questions-injection/questions-injection.module';
import { QuestionsModule } from './modules/questions/questions.module';
import { QuizModule } from './modules/quiz/quiz.module';
import { ReferralsModule } from './modules/referrals/referrals.module';
import { RefreshTokensModule } from './modules/refresh-tokens/refresh-tokens.module';
import { SchoolMembershipsModule } from './modules/school-memberships/school-memberships.module';
import { SchoolsModule } from './modules/schools/schools.module';
import { SocketModule } from './modules/socket/socket.module';
import { SolveAndWinModule } from './modules/solve-and-win/solve-and-win.module';
import { SubjectsModule } from './modules/subjects/subjects.module';
import { TokensModule } from './modules/tokens/tokens.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { UserSessionModule } from './modules/user-session/user-session.module';
import { UsersModule } from './modules/users/users.module';
import { WalletsModule } from './modules/wallets/wallets.module';
import { WithdrawalsModule } from './modules/withdrawals/withdrawals.module';
import { ClassesModule } from './modules/classes/classes.module';
import { SchoolSubjectsModule } from './modules/school-subjects/school-subjects.module';
import { StudentEnrollmentsModule } from './modules/student-enrollments/student-enrollments.module';
import { ClassSubjectAssignmentsModule } from './modules/class-subject-assignments/class-subject-assignments.module';
import { SchoolAccessModule } from './modules/school-access/school-access.module';
import { SchoolSubscriptionsModule } from './modules/school-subscriptions/school-subscriptions.module';
import { SchoolAccessPinsModule } from './modules/school-access-pins/school-access-pins.module';
import { SchoolQuestionsModule } from './modules/school-questions/school-questions.module';
import { SchoolAssessmentsModule } from './modules/school-assessments/school-assessments.module';
import { SchoolAssessmentAttemptsModule } from './modules/school-assessment-attempts/school-assessment-attempts.module';
import { SchoolReportsModule } from './modules/school-reports/school-reports.module';

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
    PracticeModule,
    PracticeWalletModule,
    SolveAndWinModule,
    QuizModule,
    PinsModule,
    SchoolsModule,
    SchoolMembershipsModule,
    ClassesModule,
    SchoolSubjectsModule,
    StudentEnrollmentsModule,
    ClassSubjectAssignmentsModule,
    SchoolAccessModule,
    SchoolSubscriptionsModule,
    SchoolAccessPinsModule,
    SchoolQuestionsModule,
    SchoolAssessmentsModule,
    SchoolAssessmentAttemptsModule,
    SchoolReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
