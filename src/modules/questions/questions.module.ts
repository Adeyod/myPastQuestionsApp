import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PlansModule } from '../plans/plans.module';
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
  ],
  controllers: [QuestionsController],
  providers: [QuestionsService, QuestionsRepository],
  exports: [QuestionsRepository],
})
export class QuestionsModule {}
