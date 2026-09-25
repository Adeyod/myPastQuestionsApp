import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { MongoServerError } from 'mongodb';
import { Model, Types } from 'mongoose';
import {
  QuizQuestionWinner,
  QuizQuestionWinnerDocument,
} from '../schemas/quiz-question-winner.schema';

@Injectable()
export class QuizQuestionWinnerRepository {
  constructor(
    @InjectModel(QuizQuestionWinner.name)
    private readonly quizQuestionWinnerModel: Model<QuizQuestionWinnerDocument>,
  ) {}

  async claimQuestionWinner(data: {
    quizId: Types.ObjectId;
    roomId: Types.ObjectId;
    questionId: Types.ObjectId;
    roundNumber: number;
    userId: Types.ObjectId;
    scoreAwarded: number;
    awardedAt: Date;
  }) {
    try {
      return await this.quizQuestionWinnerModel.create(data);
    } catch (error) {
      if (error instanceof MongoServerError && error.code === 11000) {
        return null;
      }

      throw error;
    }
  }
}
