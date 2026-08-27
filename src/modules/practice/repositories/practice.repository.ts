import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types, UpdateQuery } from 'mongoose';
import { QueryWithPaginationDto } from '../../../common/dto/query-with-pagination';
import { ExamType } from '../../../common/enums/exam-type.enum';
import { PracticeStatus } from '../enums/practice-status.enum';
import { Practice, PracticeDocument } from '../schemas/practice.schema';

@Injectable()
export class PracticeRepository {
  constructor(
    @InjectModel(Practice.name)
    private readonly practiceModel: Model<PracticeDocument>,
  ) {}

  async createPractice(
    data: {
      userId: Types.ObjectId;
      subjectId: Types.ObjectId;
      examType: ExamType;
      practiceModeId: Types.ObjectId;
      timePerQuestion: number;
      awardedPointPerCorrectAnswer: number;
      questionCount: number;
      questions: any;
      totalDurationInSeconds: number;
      status: PracticeStatus;
      correctAnswers: number;
      wrongAnswers: number;
      unansweredQuestions: number;
      score: number;
      percentage: number;
      totalPointsAwarded: number;
      startedAt: Date;
    },
    session: ClientSession,
  ) {
    const response = await new this.practiceModel(data).save({ session });

    return response;
  }

  async findPracticeById(
    practiceId: Types.ObjectId,
  ): Promise<PracticeDocument | null> {
    const response = await this.practiceModel.findById(practiceId);

    return response;
  }

  async findPracticeByIdAndUserId(
    practiceId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<PracticeDocument | null> {
    const response = await this.practiceModel
      .findOne({
        _id: practiceId,
        userId,
      })
      .populate('subjectId')
      .populate('practiceModeId')
      .populate({
        path: 'questions.questionId',
      });

    return response;
  }

  async findPracticeByIdAndUserIdForMarking(
    practiceId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<PracticeDocument | null> {
    const response = await this.practiceModel
      .findOne({
        _id: practiceId,
        userId,
        status: PracticeStatus.IN_PROGRESS,
      })
      .populate({
        path: 'questions.questionId',
        select: 'correctAnswers marks',
      })
      .exec();

    return response;
  }

  async updatePracticeById(
    practiceId: Types.ObjectId,
    data: UpdateQuery<Practice>,
  ): Promise<PracticeDocument | null> {
    const response = await this.practiceModel
      .findByIdAndUpdate(practiceId, data, {
        returnDocument: 'after',
        runValidators: true,
      })
      .exec();

    return response;
  }

  async updatePracticeAnswersByIdAndUserId(
    practiceId: Types.ObjectId,
    userId: Types.ObjectId,
    answers: {
      questionId: string;
      selectedOption: string | null;
    }[],
  ): Promise<PracticeDocument | null> {
    const bulkOperations = answers.map((answer) => ({
      updateOne: {
        filter: {
          _id: practiceId,
          userId,
          status: PracticeStatus.IN_PROGRESS,
        },
        update: {
          $set: {
            'questions.$[question].selectedOption': answer.selectedOption,
          },
        },
        arrayFilters: [
          {
            'questions.questionId': new Types.ObjectId(answer.questionId),
          },
        ],
      },
    }));

    if (bulkOperations.length > 0) {
      await this.practiceModel.bulkWrite(bulkOperations);
    }

    const response = await this.findPracticeByIdAndUserId(practiceId, userId);

    return response;
  }

  async completePracticeMarkingProcess(
    practiceId: Types.ObjectId,
    userId: Types.ObjectId,
    data: {
      questions: Practice['questions'];
      correctAnswers: number;
      wrongAnswers: number;
      unansweredQuestions: number;
      score: number;
      percentage: number;
      totalPointsAwarded: number;
      durationInSeconds: number;
      submittedAt: Date;
    },
    session: ClientSession,
  ): Promise<PracticeDocument | null> {
    const response = await this.practiceModel
      .findOneAndUpdate(
        {
          _id: practiceId,
          userId,
          status: PracticeStatus.IN_PROGRESS,
        },
        {
          $set: {
            ...data,
            status: PracticeStatus.COMPLETED,
          },
        },
        {
          returnDocument: 'after',
          runValidator: true,
          session,
        },
      )
      .exec();

    return response;
  }

  async abandonPractice(
    practiceId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<PracticeDocument | null> {
    const response = await this.practiceModel
      .findOneAndUpdate(
        {
          _id: practiceId,
          userId,
          status: PracticeStatus.IN_PROGRESS,
        },
        {
          $set: {
            status: PracticeStatus.ABANDONED,
          },
        },
        {
          returnDocument: 'after',
        },
      )
      .exec();

    return response;
  }

  async getPracticeHistoryForAdmin(queryDto: QueryWithPaginationDto) {
    const { page, limit, searchParams } = queryDto;

    let query = this.practiceModel.find();

    if (searchParams) {
      const regex = new RegExp(searchParams, 'i');

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

    const practices = await query.sort({ createdAt: -1 });

    if (practices.length === 0) {
      throw new NotFoundException({
        message: 'Practices not found.',
        success: false,
        status: 404,
      });
    }

    const response = {
      practiceObj: practices,
      totalPages: pages,
      totalCount: count,
    };

    return response;
  }
  async getPracticeHistoryByUserId(
    userId: Types.ObjectId,
    queryDto: QueryWithPaginationDto,
  ) {
    const { page, limit, searchParams } = queryDto;

    let query = this.practiceModel.find({ userId });

    if (searchParams) {
      const regex = new RegExp(searchParams, 'i');

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

    const practices = await query.sort({ createdAt: -1 });

    if (practices.length === 0) {
      throw new NotFoundException({
        message: 'Practices not found.',
        success: false,
        status: 404,
      });
    }

    const response = {
      practiceObj: practices,
      totalPages: pages,
      totalCount: count,
    };

    return response;
  }

  async getDashboardStatsByUserId(userId: Types.ObjectId, examType?: string) {
    const response = await this.practiceModel.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          examType,
          status: PracticeStatus.COMPLETED,
        },
      },
      {
        $group: {
          _id: null,

          testsTaken: {
            $sum: 1,
          },

          averageScore: {
            $avg: '$percentage',
          },

          totalStudySeconds: {
            $sum: '$durationInSeconds',
          },

          totalCorrectAnswers: {
            $sum: '$correctAnswers',
          },

          totalPointsEarned: {
            $sum: '$totalPointsAwarded',
          },
        },
      },
      {
        $project: {
          _id: 0,
          testsTaken: 1,
          averageScore: {
            $round: ['$averageScore', 2],
          },
          totalStudySeconds: 1,
          totalStudyHours: {
            $round: [
              {
                $divide: ['$totalStudySeconds', 3600],
              },
              2,
            ],
          },
          totalCorrectAnswers: 1,
          totalPointsEarned: 1,
        },
      },
    ]);

    return response;
  }

  async getRecentCompletedPractices(
    userId: Types.ObjectId,
    examType: string,
    queryDto: QueryWithPaginationDto,
  ) {
    const response = await this.practiceModel
      .find({
        userId,
        examType,
        status: PracticeStatus.COMPLETED,
      })
      .select('percentage createdAt')
      .sort({ submittedAt: -1 })
      .limit(queryDto.limit)
      .exec();

    return response;
  }
}
