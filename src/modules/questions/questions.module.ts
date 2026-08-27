import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PlansModule } from '../plans/plans.module';
import { PracticeWalletModule } from '../practice-wallet/practice-wallet.module';
import { PracticeModule } from '../practice/practice.module';
import { SubjectsModule } from '../subjects/subjects.module';
import { UserSessionModule } from '../user-session/user-session.module';
import { WalletsModule } from '../wallets/wallets.module';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';
import { QuestionsRepository } from './repositories/questions.repository';
import { Question, QuestionSchema } from './schemas/question.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Question.name, schema: QuestionSchema },
    ]),
    SubjectsModule,
    WalletsModule,
    PlansModule,
    UserSessionModule,
    PracticeModule,
    PracticeWalletModule,
  ],
  controllers: [QuestionsController],
  providers: [QuestionsService, QuestionsRepository],
  exports: [QuestionsRepository],
})
export class QuestionsModule {}
