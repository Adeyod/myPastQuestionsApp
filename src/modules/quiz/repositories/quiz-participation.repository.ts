import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AnyBulkWriteOperation, Model, Types } from 'mongoose';
import { QueryWithPaginationDto } from '../../../common/dto/query-with-pagination';
import {
  ParticipantStatus,
  QuizParticipant,
  QuizParticipantDocument,
} from '../schemas/quiz-participant.schema';

@Injectable()
export class QuizParticipantRepository {
  constructor(
    @InjectModel(QuizParticipant.name)
    private readonly participantModel: Model<QuizParticipantDocument>,
  ) {}

  async createParticipant(
    quizId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<QuizParticipantDocument> {
    const response = await new this.participantModel({
      quizId,
      userId,
      status: ParticipantStatus.REGISTERED,
      currentRound: 1,
      totalScore: 0,
      totalTimeTakenInSeconds: 0,
    }).save();

    return response;
  }

  async registerParticipantSocket(
    quizId: Types.ObjectId,
    userId: Types.ObjectId,
    socketId: string,
  ): Promise<QuizParticipantDocument | null> {
    const response = await this.participantModel.findOneAndUpdate(
      {
        quizId,
        userId,
      },
      {
        $set: {
          socketId,
          connected: true,
          disconnectedAt: null,
        },
      },
      {
        new: true,
      },
    );

    return response;
  }

  async findParticipantByQuizAndUser(
    quizId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<QuizParticipantDocument | null> {
    const response = await this.participantModel
      .findOne({ quizId, userId })
      .exec();

    return response;
  }

  async countQuizParticipants(quizId: Types.ObjectId): Promise<number> {
    const response = await this.participantModel
      .countDocuments({ quizId })
      .exec();

    return response;
  }

  async findAllMyQuizParticipations(
    userId: Types.ObjectId,
    queryDto: QueryWithPaginationDto,
  ): Promise<{
    totalCount: number;
    totalPages: number;
    participationsObj: QuizParticipantDocument[];
  }> {
    const { page, limit, searchParams } = queryDto;
    let query = this.participantModel.find({ userId });

    if (searchParams) {
      const regex = new RegExp(searchParams, 'i');

      query = query.where({
        $or: [{ status: { $regex: regex } }, { quiz_title: { $regex: regex } }],
      });
    }

    const count = await query.clone().countDocuments();
    let pages = 0;

    if (page !== undefined && limit !== undefined && count !== 0) {
      const offset = (page - 1) * limit;

      query = query.skip(offset).limit(limit);
      pages = Math.ceil(count / limit);

      if (page > pages) {
        throw new NotFoundException({
          message: 'Page not found.',
          success: false,
          status: 404,
        });
      }
    }

    const participations = await query
      .populate('quizId')
      .sort({ createdAt: -1 });

    if (participations.length === 0) {
      throw new NotFoundException({
        message: 'Quiz participations not found.',
        success: false,
        status: 404,
      });
    }

    const response = {
      totalCount: count,
      totalPages: pages,
      participationsObj: participations,
    };

    return response;
  }

  async saveParticipant(
    participant: QuizParticipantDocument,
  ): Promise<QuizParticipantDocument> {
    const response = await participant.save();

    return response;
  }

  async findParticipantAndUpdate(
    userId: Types.ObjectId,
    socketId: string,
  ): Promise<QuizParticipantDocument | null> {
    const response = await this.participantModel.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
        socketId,
      },
      {
        $set: {
          connected: false,
          disconnectedAt: new Date(),
        },
      },
      {
        returnDocument: 'after',
      },
    );

    return response;
  }

  // 5. Fetch all active participants currently in a specific status (e.g. IN_ROOM, QUALIFIED, TIE_BREAK)
  async findParticipantsByStatus(
    quizId: Types.ObjectId,
    status: ParticipantStatus,
  ): Promise<QuizParticipantDocument[]> {
    const response = await this.participantModel
      .find({ quizId, status })
      .populate('userId', 'name email avatar')
      .exec();

    return response;
  }

  async bulkUpdateParticipantsStatusForRoomJoin(
    quizId: Types.ObjectId,
    userIds: Types.ObjectId[],
  ): Promise<number> {
    const result = await this.participantModel
      .updateMany(
        { quizId, userId: { $in: userIds } },
        { $set: { status: ParticipantStatus.IN_ROOM } },
      )
      .exec();

    return result.modifiedCount;
  }

  // 7. Bulk update statuses at the end of a round (Elimination / Qualification / Tie-Break)
  async bulkUpdateRoundStatuses(
    quizId: Types.ObjectId,
    updates: Array<{
      userId: Types.ObjectId;
      status: ParticipantStatus;
      score: number;
      timeTakenInSeconds: number;
      currentRound: number;
    }>,
  ): Promise<void> {
    const bulkOps = updates.map((item) => ({
      updateOne: {
        filter: { quizId, userId: item.userId },
        update: {
          $set: {
            status: item.status,
            totalScore: item.score,
            totalTimeTakenInSeconds: item.timeTakenInSeconds,
            currentRound: item.currentRound,
          },
        },
      },
    }));

    if (bulkOps.length > 0) {
      await this.participantModel.bulkWrite(bulkOps);
    }
  }

  async bulkWrite(bulkOps: AnyBulkWriteOperation<QuizParticipantDocument>[]) {
    if (!bulkOps || bulkOps.length === 0) return;
    return await this.participantModel.bulkWrite(bulkOps);
  }

  // 8. Retrieve all participants eligible for tie-breaking in a given quiz
  async findTiedParticipants(
    quizId: Types.ObjectId,
  ): Promise<QuizParticipantDocument[]> {
    const response = await this.participantModel
      .find({ quizId, status: ParticipantStatus.TIE_BREAK })
      .populate('userId', 'name email avatar')
      .exec();

    return response;
  }

  // 9. Assign final rewards and positions at the end of the final round
  async setFinalStandings(
    quizId: Types.ObjectId,
    standings: Array<{
      userId: Types.ObjectId;
      finalPosition: number;
      rewardEarned: number;
    }>,
  ): Promise<void> {
    const bulkOps = standings.map((item) => ({
      updateOne: {
        filter: { quizId, userId: item.userId },
        update: {
          $set: {
            status: ParticipantStatus.COMPLETED,
            finalPosition: item.finalPosition,
            rewardEarned: item.rewardEarned,
          },
        },
      },
    }));

    if (bulkOps.length > 0) {
      await this.participantModel.bulkWrite(bulkOps);
    }
  }
}
