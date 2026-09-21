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
    roomId: string;
    status: QuizRoomStatus;
    currentRound: number;
    currentQuestionIndex: -1;
  }): Promise<QuizRoomDocument> {
    const { quizId, roomId, status, currentRound, currentQuestionIndex } =
      payload;

    const response = await new this.quizRoomModel({
      quizId,
      roomId,
      status,
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

  async findRoomByRoomId(roomId: string): Promise<QuizRoomDocument | null> {
    const response = await this.quizRoomModel.findOne({ roomId }).exec();

    return response;
  }

  async saveQuizRoom(quizRoom: QuizRoomDocument): Promise<QuizRoomDocument> {
    const response = await quizRoom.save();

    return response;
  }
}
