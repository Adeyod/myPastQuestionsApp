import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SyncLeaderboardDto } from '../dtos/join-quiz.dto';
import {
  QuizLeaderboard,
  QuizLeaderboardDocument,
} from '../schemas/quiz-leadership.schema';

@Injectable()
export class QuizLeaderboardRepository {
  constructor(
    @InjectModel(QuizLeaderboard.name)
    private readonly leaderboardModel: Model<QuizLeaderboardDocument>,
  ) {}

  async upsertLeaderboard(
    dto: SyncLeaderboardDto,
  ): Promise<QuizLeaderboardDocument> {
    const quizId = new Types.ObjectId(dto.quizId);
    const entries = dto.entries.map((e) => ({
      ...e,
      userId: new Types.ObjectId(e.userId),
    }));

    const response = await this.leaderboardModel
      .findOneAndUpdate(
        { quizId, roundNumber: dto.roundNumber },
        { quizId, roundNumber: dto.roundNumber, entries },
        { upsert: true, returnDocument: 'after' },
      )
      .exec();

    return response;
  }

  async findByQuizAndRound(
    quizId: Types.ObjectId,
    roundNumber: number,
  ): Promise<QuizLeaderboardDocument | null> {
    const response = await this.leaderboardModel
      .findOne({ quizId, roundNumber })
      .exec();

    return response;
  }
}
