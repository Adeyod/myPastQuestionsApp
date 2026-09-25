import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { SolveAndWinModule } from '../solve-and-win/solve-and-win.module';
import { UserSessionModule } from '../user-session/user-session.module';
import { UsersModule } from '../users/users.module';
import { QuizController } from './quiz.controller';
import { QuizGateway } from './quiz.gateway';
import { QuizService } from './quiz.service';
import { QuizAnswerRepository } from './repositories/quiz-answer.repository';
import { QuizLeaderboardRepository } from './repositories/quiz-leaderboard.repository';
import { QuizParticipantRepository } from './repositories/quiz-participation.repository';
import { QuizQuestionWinnerRepository } from './repositories/quiz-question-winner.repository';
import { QuizRoomRepository } from './repositories/quiz-room.repository';
import { QuizVoteRepository } from './repositories/quiz-vote.repository';
import { QuizRepository } from './repositories/quiz.repository';
import { QuizAnswer, QuizAnswerSchema } from './schemas/quiz-answer.schema';
import {
  QuizLeaderboard,
  QuizLeaderboardSchema,
} from './schemas/quiz-leadership.schema';
import {
  QuizParticipant,
  QuizParticipantSchema,
} from './schemas/quiz-participant.schema';
import {
  QuizQuestionWinner,
  QuizQuestionWinnerSchema,
} from './schemas/quiz-question-winner.schema';
import { QuizRoom, QuizRoomSchema } from './schemas/quiz-room.schema';
import { QuizVote, QuizVoteSchema } from './schemas/quiz-vote.schema';
import { Quiz, QuizSchema } from './schemas/quiz.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: QuizLeaderboard.name, schema: QuizLeaderboardSchema },
      { name: QuizParticipant.name, schema: QuizParticipantSchema },
      { name: QuizVote.name, schema: QuizVoteSchema },
      { name: Quiz.name, schema: QuizSchema },
      { name: QuizAnswer.name, schema: QuizAnswerSchema },
      { name: QuizQuestionWinner.name, schema: QuizQuestionWinnerSchema },
      { name: QuizRoom.name, schema: QuizRoomSchema },
    ]),
    UserSessionModule,
    UsersModule,
    SolveAndWinModule,
    AuthModule,
  ],
  controllers: [QuizController],
  providers: [
    QuizService,
    QuizRepository,
    QuizLeaderboardRepository,
    QuizParticipantRepository,
    QuizVoteRepository,
    QuizGateway,
    QuizRoomRepository,
    QuizAnswerRepository,
    QuizQuestionWinnerRepository,
  ],
})
export class QuizModule {}
