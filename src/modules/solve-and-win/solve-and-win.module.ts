import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PracticeWalletModule } from '../practice-wallet/practice-wallet.module';
import { SubjectsModule } from '../subjects/subjects.module';
import { UserSessionModule } from '../user-session/user-session.module';
import { SolveAndWinContestRepository } from './repositories/solve-and-win-contest.repository';
import { SolveAndWinParticipationRepository } from './repositories/solve-and-win-participant.repository';
import { SolveAndWinQuestionRepository } from './repositories/solve-and-win-question.repository';
import {
  SolveAndWinContest,
  SolveAndWinContestSchema,
} from './schemas/solve-and-win-contest.schema';
import {
  SolveAndWinParticipation,
  SolveAndWinParticipationSchema,
} from './schemas/solve-and-win-participantion.schema';
import {
  SolveAndWinQuestion,
  SolveAndWinQuestionSchema,
} from './schemas/solve-and-win-question.schema';
import { SolveAndWinController } from './solve-and-win.controller';
import { SolveAndWinService } from './solve-and-win.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SolveAndWinContest.name, schema: SolveAndWinContestSchema },
      { name: SolveAndWinQuestion.name, schema: SolveAndWinQuestionSchema },
      {
        name: SolveAndWinParticipation.name,
        schema: SolveAndWinParticipationSchema,
      },
    ]),
    UserSessionModule,
    SubjectsModule,
    PracticeWalletModule,
  ],
  controllers: [SolveAndWinController],
  providers: [
    SolveAndWinService,
    SolveAndWinContestRepository,
    SolveAndWinParticipationRepository,
    SolveAndWinQuestionRepository,
  ],
})
export class SolveAndWinModule {}
