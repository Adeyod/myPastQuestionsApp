import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { QuizAnswer, QuizAnswerDocument } from '../schemas/quiz-answer.schema';

@Injectable()
export class QuizAnswerRepository {
  constructor(
    @InjectModel(QuizAnswer.name)
    private readonly quizAnswerModel: Model<QuizAnswerDocument>,
  ) {}

  async findParticipantAnswer(
    quizId: Types.ObjectId,
    roundNumber: number,
    userId: Types.ObjectId,
    questionId: Types.ObjectId,
  ): Promise<QuizAnswerDocument | null> {
    const response = await this.quizAnswerModel.findOne({
      quizId,
      roundNumber,
      userId,
      questionId,
    });

    return response;
  }
  async getFastestCorrectParticipant(
    quizId: string,
    userId: string,
    questionId: string,
  ): Promise<QuizAnswerDocument | null> {
    const quiz = new Types.ObjectId(quizId);
    const question = new Types.ObjectId(questionId);
    const user = new Types.ObjectId(userId);

    const response = await this.quizAnswerModel
      .findOne({
        quizId: quiz,
        userId: user,
        questionId: question,
        isFirstCorrectAnswer: true,
      })
      .populate('userId', 'firstName lastName email image')
      .exec();

    return response;
  }

  async createParticipantQuizAnswer(payload: {
    quizId: Types.ObjectId;
    roomId: Types.ObjectId;
    userId: Types.ObjectId;
    questionId: Types.ObjectId;
    roundNumber: number;
    selectedAnswerId: Types.ObjectId;
    isCorrect: boolean;
    isFirstCorrectAnswer: boolean;
    scoreAwarded: number;
    timeTakenInSeconds: number;
    answeredAt: Date;
  }): Promise<QuizAnswerDocument | null> {
    const response = await new this.quizAnswerModel(payload).save();

    return response;
  }
}
