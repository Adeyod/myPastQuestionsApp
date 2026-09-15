import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SolveAndWinModule } from '../solve-and-win/solve-and-win.module';
import { UserSessionModule } from '../user-session/user-session.module';
import { QuizController } from './quiz.controller';
import { QuizService } from './quiz.service';
import { QuizLeaderboardRepository } from './repositories/quiz-leaderboard.repository';
import { QuizParticipantRepository } from './repositories/quiz-participation.repository';
import { QuizVoteRepository } from './repositories/quiz-vote.repository';
import { QuizRepository } from './repositories/quiz.repository';
import {
  QuizLeaderboard,
  QuizLeaderboardSchema,
} from './schemas/quiz-leadership.schema';
import {
  QuizParticipant,
  QuizParticipantSchema,
} from './schemas/quiz-participant.schema';
import { QuizVote, QuizVoteSchema } from './schemas/quiz-vote.schema';
import { Quiz, QuizSchema } from './schemas/quiz.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: QuizLeaderboard.name, schema: QuizLeaderboardSchema },
      { name: QuizParticipant.name, schema: QuizParticipantSchema },
      { name: QuizVote.name, schema: QuizVoteSchema },
      { name: Quiz.name, schema: QuizSchema },
    ]),
    UserSessionModule,
    SolveAndWinModule,
  ],
  controllers: [QuizController],
  providers: [
    QuizService,
    QuizRepository,
    QuizLeaderboardRepository,
    QuizParticipantRepository,
    QuizVoteRepository,
  ],
})
export class QuizModule {}
