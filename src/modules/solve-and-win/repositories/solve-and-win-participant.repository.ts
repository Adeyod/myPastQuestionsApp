import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { QueryWithPaginationDto } from '../../../common/dto/query-with-pagination';
import {
  SolveAndWinParticipation,
  SolveAndWinParticipationDocument,
} from '../schemas/solve-and-win-participantion.schema';

@Injectable()
export class SolveAndWinParticipationRepository {
  constructor(
    @InjectModel(SolveAndWinParticipation.name)
    private readonly participationModel: Model<SolveAndWinParticipationDocument>,
  ) {}

  async createSolveAndWinParticipation(
    contestId: Types.ObjectId,
    userId: Types.ObjectId,
    pointsSpent: number,
  ): Promise<SolveAndWinParticipationDocument> {
    const response = await new this.participationModel({
      contestId,
      userId,
      pointsSpent,
    }).save();

    return response;
  }

  async findSolveAndWinParticipationByIdAndUserId(
    contestId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<SolveAndWinParticipationDocument | null> {
    const response = await this.participationModel.findOne({
      contestId,
      userId,
    });

    return response;
  }

  async getAllMyContestParticipations(
    userId: Types.ObjectId,
    queryDto: QueryWithPaginationDto,
  ): Promise<{
    totalCount: number;
    totalPages: number;
    contestParticipationObj: SolveAndWinParticipationDocument[];
  }> {
    const { page, limit, searchParams } = queryDto;

    let query = this.participationModel.find({ userId });

    if (searchParams) {
      const regex = new RegExp(searchParams, 'i');

      const isBooleanSearch =
        searchParams.toLowerCase() === 'true' ||
        searchParams.toLowerCase() === 'false';

      query = query.where({
        $or: [{ status: { $regex: regex } }],
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

    const participations = await query.sort({ createdAt: -1 });

    if (participations.length === 0) {
      throw new NotFoundException({
        message: 'Contest participations not found.',
        success: false,
        status: 404,
      });
    }

    const response = {
      totalCount: count,
      totalPages: pages,
      contestParticipationObj: participations,
    };

    return response;
  }
  async getAllContestParticipations(queryDto: QueryWithPaginationDto): Promise<{
    totalCount: number;
    totalPages: number;
    contestParticipationObj: SolveAndWinParticipationDocument[];
  }> {
    const { page, limit, searchParams } = queryDto;

    let query = this.participationModel.find();

    if (searchParams) {
      const regex = new RegExp(searchParams, 'i');

      const isBooleanSearch =
        searchParams.toLowerCase() === 'true' ||
        searchParams.toLowerCase() === 'false';

      query = query.where({
        $or: [{ status: { $regex: regex } }],
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

    const participations = await query.sort({ createdAt: -1 });

    if (participations.length === 0) {
      throw new NotFoundException({
        message: 'Contest participations not found.',
        success: false,
        status: 404,
      });
    }

    const response = {
      totalCount: count,
      totalPages: pages,
      contestParticipationObj: participations,
    };

    return response;
  }
}
