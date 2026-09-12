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
  //   const { page = 1, limit = 10, searchParams } = queryDto;
  //   const skip = (page - 1) * limit;
  //   const now = new Date();

  //   console.log('queryDto:', queryDto);

  //   const filter = {
  //     userId,
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

  //   const filtered = activeParticipationsYetToStart.map((a) => {
  //     const _id = a._id;
  //     const contestId = a.contestId;

  //     return {
  //       _id,
  //       contestId,
  //     };
  //   });

  //   const res = {
  //     totalCount: activeParticipationsYetToStart.length,
  //     totalPages: Math.ceil(total / limit),
  //     contestParticipationObj: filtered,
  //   };

  //   console.log('filtered:', filtered);
  //   console.log('data:', data);
  //   console.log(
  //     'activeParticipationsYetToStart:',
  //     activeParticipationsYetToStart,
  //   );
  //   console.log('total:', total);

  //   return res;
  // }

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

  async getAllContestParticipationsYetToStart(
    userId: Types.ObjectId,
    queryDto: QueryWithPaginationDto,
  ) {
    const { page = 1, limit = 10 } = queryDto;
    const skip = (page - 1) * limit;
    const now = new Date();

    // const pipeline: any[] = [
    //   // 1. Match unstarted participations for the user
    //   {
    //     $match: {
    //       userId,
    //     },
    //   },
    //   // 2. Lookup contest details
    //   {
    //     $lookup: {
    //       from: 'solveandwincontests', // Double-check exact collection name in your MongoDB GUI (Compass/Atlas)
    //       localField: 'contestId',
    //       foreignField: '_id',
    //       as: 'contest',
    //     },
    //   },
    //   // 3. Unwind joined contest
    //   { $unwind: '$contest' },
    //   // 4. Ensure contest start date is strictly in the future
    //   {
    //     $match: {
    //       'contest.startDate': { $gt: now },
    //     },
    //   },
    //   // 5. Project ONLY required keys
    //   {
    //     $project: {
    //       _id: 1,
    //       contestId: 1,
    //     },
    //   },
    // ];

    const pipeline: any[] = [
      {
        $match: {
          userId,
        },
      },
      {
        $lookup: {
          from: 'solveandwincontests',
          localField: 'contestId',
          foreignField: '_id',
          as: 'contest',
        },
      },
      {
        $unwind: '$contest',
      },
      {
        $match: {
          'contest.startDate': {
            $gt: now,
          },
        },
      },
      {
        $project: {
          _id: 1,
          contestId: 1,
        },
      },
    ];
    const result = await this.participationModel.aggregate([
      ...pipeline,
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: limit }],
          totalCount: [{ $count: 'count' }],
        },
      },
    ]);

    // const result = await this.participationModel.aggregate([
    //   {
    //     $match: {
    //       userId,
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: 'solveandwincontests',
    //       localField: 'contestId',
    //       foreignField: '_id',
    //       as: 'contest',
    //     },
    //   },
    //   {
    //     $unwind: '$contest',
    //   },
    //   {
    //     $project: {
    //       _id: 1,
    //       contestId: 1,
    //       'contest._id': 1,
    //       'contest.startDate': 1,
    //     },
    //   },
    // ]);

    console.log('result:', result);
    const total = result[0]?.totalCount[0]?.count || 0;
    const contestParticipationObj = result[0]?.data || [];

    console.log('contestParticipationObj:', contestParticipationObj);
    console.log('total:', total);

    return {
      totalCount: total,
      totalPages: Math.ceil(total / limit),
      contestParticipationObj,
    };
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
