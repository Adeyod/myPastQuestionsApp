import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { QueryWithPaginationDto } from '../../../common/dto/query-with-pagination';
import {
  ParticipationSubject,
  SolveAndWinParticipation,
  SolveAndWinParticipationDocument,
  SolveAndWinParticipationStatus,
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

  // async getAllContestParticipationsYetToStart(
  //   userId: Types.ObjectId,
  //   queryDto: QueryWithPaginationDto,
  // ) {
  //   const { page = 1, limit = 10 } = queryDto;
  //   const skip = (page - 1) * limit;
  //   const now = new Date();

  //   const filter = {
  //     userId,
  //     $or: [{ subjects: { $size: 0 } }, { 'subjects.startedAt': null }],
  //   };

  //   const [data, total] = await Promise.all([
  //     this.participationModel
  //       .find(filter)
  //       .populate({
  //         path: 'contestId',
  //         match: { startDate: { $gt: now } },
  //       })
  //       .skip(skip)
  //       .limit(limit)
  //       .exec(),
  //     this.participationModel.countDocuments(filter).exec(),
  //   ]);

  //   const activeParticipationsYetToStart = data.filter(
  //     (participation) => participation.contestId !== null,
  //   );

  //   const res = {
  //     totalCount: activeParticipationsYetToStart.length,
  //     totalPages: Math.ceil(total / limit),
  //     contestParticipationObj: activeParticipationsYetToStart,
  //   };

  //   return res;
  // }

  async getAllContestParticipationsYetToStart(
    userId: Types.ObjectId,
    queryDto: QueryWithPaginationDto,
  ) {
    const { page = 1, limit = 10 } = queryDto;
    const skip = (page - 1) * limit;
    const now = new Date();

    const pipeline: any[] = [
      // 1. Match user's unstarted participation records
      {
        $match: {
          userId,
          $or: [{ subjects: { $size: 0 } }, { 'subjects.startedAt': null }],
        },
      },
      // 2. Join with the SolveAndWinContest collection (adjust table name if different)
      {
        $lookup: {
          from: 'solveandwincontests', // Make sure this matches your MongoDB collection name for contests
          localField: 'contestId',
          foreignField: '_id',
          as: 'contest',
        },
      },
      // 3. Unwind joined contest array
      { $unwind: '$contest' },
      // 4. Filter only contests where startDate is strictly in the future
      {
        $match: {
          'contest.startDate': { $gt: now },
        },
      },
    ];

    // Execute pagination facet query
    const result = await this.participationModel.aggregate([
      ...pipeline,
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: limit },
            // 5. Shape output to return ONLY _id and contestId
            {
              $project: {
                _id: 1,
                contestId: 1,
              },
            },
          ],
          totalCount: [{ $count: 'count' }],
        },
      },
    ]);

    const total = result[0]?.totalCount[0]?.count || 0;
    const contestParticipationObj = result[0]?.data || [];

    return {
      totalCount: total,
      totalPages: Math.ceil(total / limit),
      contestParticipationObj,
    };
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

  async updateParticipationSubjects(
    participationId: Types.ObjectId,
    subjects: ParticipationSubject[],
  ): Promise<SolveAndWinParticipationDocument | null> {
    const response = await this.participationModel
      .findByIdAndUpdate(
        participationId,
        {
          $set: {
            subjects,
          },
        },
        {
          returnDocument: 'after',
          runValidators: true,
        },
      )
      .exec();

    return response;
  }

  async updateSubjectAnswers(
    participationId: Types.ObjectId,
    updatedSubjects: ParticipationSubject[],
    totalScore: number,
    totalCorrect: number,
    totalWrong: number,
    totalUnanswered: number,
  ): Promise<SolveAndWinParticipationDocument | null> {
    return this.participationModel
      .findByIdAndUpdate(
        participationId,
        {
          $set: {
            subjects: updatedSubjects,
            score: totalScore,
            correctAnswers: totalCorrect,
            wrongAnswers: totalWrong,
            unansweredQuestions: totalUnanswered,
          },
        },
        { returnDocument: 'after' },
      )
      .exec();
  }

  async updateSubjectRemainingTime(
    participationId: Types.ObjectId,
    updatedSubjects: ParticipationSubject[],
  ): Promise<SolveAndWinParticipationDocument | null> {
    return this.participationModel
      .findByIdAndUpdate(
        participationId,
        {
          $set: {
            subjects: updatedSubjects,
          },
        },
        { returnDocument: 'after' },
      )
      .exec();
  }

  async submitSubjectParticipation(
    participationId: Types.ObjectId,
    updatedSubjects: ParticipationSubject[],
    overallScore: number,
    overallCorrect: number,
    overallWrong: number,
    overallUnanswered: number,
    overallPercentage: number,
    status: SolveAndWinParticipationStatus,
    submittedAt?: Date | null,
  ): Promise<SolveAndWinParticipationDocument | null> {
    return this.participationModel
      .findByIdAndUpdate(
        participationId,
        {
          $set: {
            subjects: updatedSubjects,
            score: overallScore,
            correctAnswers: overallCorrect,
            wrongAnswers: overallWrong,
            unansweredQuestions: overallUnanswered,
            percentage: overallPercentage,
            status: status,
            ...(submittedAt ? { submittedAt } : {}),
          },
        },
        { new: true },
      )
      .exec();
  }
}
