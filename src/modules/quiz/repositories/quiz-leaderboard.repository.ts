import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SyncLeaderboardDto } from '../dtos/join-quiz.dto';
import {
  LeaderboardEntry,
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

  async upsertAndIncrementEntry(payload: {
    quizId: Types.ObjectId;
    roundNumber: number;
    userId: Types.ObjectId;
    roundScore: number;
    totalScore: number;
    correctAnswers: number;
    answeredQuestions: number;
    timeTakenInSeconds: number;
    isEliminated: boolean;
  }): Promise<QuizLeaderboardDocument> {
    const {
      quizId,
      roundNumber,
      userId,
      roundScore,
      totalScore,
      correctAnswers,
      answeredQuestions,
      timeTakenInSeconds,
      isEliminated,
    } = payload;

    // 1. Try to update an existing participant entry.
    const existingLeaderboard = await this.leaderboardModel.findOneAndUpdate(
      {
        quizId,
        roundNumber,
        'entries.userId': userId,
      },
      {
        $inc: {
          'entries.$.roundScore': roundScore,
          'entries.$.correctAnswers': correctAnswers,
          'entries.$.answeredQuestions': answeredQuestions,
          'entries.$.timeTakenInSeconds': timeTakenInSeconds,
        },
        $set: {
          'entries.$.totalScore': totalScore,
          'entries.$.isEliminated': isEliminated,
        },
      },
      {
        returnDocument: 'after',
      },
    );

    if (existingLeaderboard) {
      return existingLeaderboard;
    }

    // 2. Leaderboard doesn't contain this participant yet.
    const entry: LeaderboardEntry = {
      userId,
      roundScore,
      totalScore,
      timeTakenInSeconds,
      correctAnswers,
      answeredQuestions,
      rank: 0,
      isEliminated,
      isTied: false,
      tieGroup: null,
    };

    // 3. Try to add the participant to an existing leaderboard.
    const updatedLeaderboard = await this.leaderboardModel.findOneAndUpdate(
      {
        quizId,
        roundNumber,
        'entries.userId': {
          $ne: userId,
        },
      },
      {
        $push: {
          entries: entry,
        },
      },
      {
        new: true,
      },
    );

    if (updatedLeaderboard) {
      return updatedLeaderboard;
    }

    // 4. No leaderboard exists yet. Create it.
    try {
      return await this.leaderboardModel.create({
        quizId,
        roundNumber,
        entries: [entry],
        hasTie: false,
        hasTieBreakOccurred: false,
      });
    } catch (error: any) {
      // Another request may have created the leaderboard
      // at exactly the same time.
      if (error?.code === 11000) {
        const leaderboard = await this.leaderboardModel.findOneAndUpdate(
          {
            quizId,
            roundNumber,
            'entries.userId': {
              $ne: userId,
            },
          },
          {
            $push: {
              entries: entry,
            },
          },
          {
            new: true,
          },
        );

        if (leaderboard) {
          return leaderboard;
        }
      }

      throw error;
    }
  }
}
