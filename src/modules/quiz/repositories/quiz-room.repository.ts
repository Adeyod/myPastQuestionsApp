import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  QuizRoom,
  QuizRoomDocument,
  QuizRoomStatus,
} from '../schemas/quiz-room.schema';

@Injectable()
export class QuizRoomRepository {
  constructor(
    @InjectModel(QuizRoom.name)
    private readonly quizRoomModel: Model<QuizRoomDocument>,
  ) {}

  async createRoom(payload: {
    quizId: Types.ObjectId;
    hostId: Types.ObjectId;
    roomId: string;
    status: QuizRoomStatus;
    currentRound: number;
    currentQuestionIndex: -1;
  }): Promise<QuizRoomDocument> {
    const {
      quizId,
      roomId,
      status,
      hostId,
      currentRound,
      currentQuestionIndex,
    } = payload;

    const response = await new this.quizRoomModel({
      quizId,
      roomId,
      status,
      hostId,
      currentRound,
      currentQuestionIndex,
    }).save();

    return response;
  }

  async findActiveRoomByQuizId(
    quizId: Types.ObjectId,
  ): Promise<QuizRoomDocument | null> {
    return this.quizRoomModel.findOne({
      quizId,
      status: {
        $in: [QuizRoomStatus.WAITING, QuizRoomStatus.IN_PROGRESS],
      },
    });
  }

  async findRoomByQuizId(
    quizId: Types.ObjectId,
  ): Promise<QuizRoomDocument | null> {
    const response = await this.quizRoomModel.findOne({ quizId }).exec();

    return response;
  }
  async findRoomByRoomId(roomId: string): Promise<QuizRoomDocument | null> {
    const response = await this.quizRoomModel.findOne({ roomId }).exec();

    return response;
  }

  async saveQuizRoom(quizRoom: QuizRoomDocument): Promise<QuizRoomDocument> {
    const response = await quizRoom.save();

    return response;
  }

  async updateRoomCurrentQuestion(
    roomId: string,
    data: {
      questionId: Types.ObjectId;
      questionNumber: number;
      startedAt: Date;
      durationInSeconds: number;
    },
  ): Promise<QuizRoomDocument | null> {
    const GRACE_PERIOD_MS = 2 * 1000;

    const endsAt = new Date(
      data.startedAt.getTime() +
        data.durationInSeconds * 1000 +
        GRACE_PERIOD_MS,
    );

    const response = await this.quizRoomModel.findOneAndUpdate(
      { roomId },
      {
        $set: {
          currentQuestionId: data.questionId,
          currentQuestionNumber: data.questionNumber,
          questionStartedAt: data.startedAt,
          questionEndsAt: endsAt,
        },
      },
      {
        returnDocument: 'after',
      },
    );

    return response;
  }
}
