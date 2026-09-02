import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { ClientSession } from 'mongoose';
import { QueryWithPaginationDto } from '../../../common/dto/query-with-pagination';
import {
  SolveAndWinContest,
  SolveAndWinContestDocument,
  SolveAndWinContestStatus,
} from '../schemas/solve-and-win-contest.schema';

@Injectable()
export class SolveAndWinContestRepository {
  constructor(
    @InjectModel(SolveAndWinContest.name)
    private readonly contestModel: Model<SolveAndWinContestDocument>,
  ) {}

  async createSolveAndWinContest(
    data: Partial<SolveAndWinContest>,
  ): Promise<SolveAndWinContestDocument> {
    const contest = new this.contestModel(data);

    return await contest.save();
  }

  async findSolveAndWinContestById(
    contestId: Types.ObjectId,
  ): Promise<SolveAndWinContestDocument | null> {
    return await this.contestModel.findById(contestId).exec();
  }

  async findSolveAndWinContestByIdWithSubjects(
    contestId: Types.ObjectId,
  ): Promise<SolveAndWinContestDocument | null> {
    return await this.contestModel
      .findById(contestId)
      .populate('subjects.subjectId', 'name')
      .exec();
  }

  async findAllSolveAndWinContests(queryDto: QueryWithPaginationDto): Promise<{
    totalCount: number;
    totalPages: number;
    solveAndWinContestObj: SolveAndWinContestDocument[];
  }> {
    const { page, limit, searchParams } = queryDto;
    let query = this.contestModel.find();

    if (searchParams) {
      const regex = new RegExp(searchParams, 'i');

      query = query.where({
        $or: [{ status: { $regex: regex } }, { title: { $regex: regex } }],
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

    const contests = await query
      .populate('subjects.subjectId', 'name')
      .sort({ createdAt: -1 });

    if (contests.length === 0) {
      throw new NotFoundException({
        message: 'Contests not found.',
        success: false,
        status: 404,
      });
    }

    const response = {
      totalCount: count,
      totalPages: pages,
      solveAndWinContestObj: contests,
    };

    return response;
  }

  async findActiveContests(): Promise<SolveAndWinContestDocument[]> {
    return await this.contestModel
      .find({
        isActive: true,
      })
      .populate('subjects.subjectId', 'name')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findSolveAndWinByStatus(
    status: SolveAndWinContestStatus,
  ): Promise<SolveAndWinContestDocument[]> {
    return await this.contestModel
      .find({
        status,
      })
      .populate('subjects.subjectId', 'name')
      .sort({ createdAt: -1 })
      .exec();
  }

  async updateSolveAndWinById(
    contestId: Types.ObjectId,
    data: Partial<SolveAndWinContest>,
  ): Promise<SolveAndWinContestDocument | null> {
    return await this.contestModel
      .findByIdAndUpdate(
        contestId,
        {
          $set: data,
        },
        {
          new: true,
          runValidators: true,
        },
      )
      .exec();
  }

  async addSubjectsToContest(
    contestId: Types.ObjectId,
    subjectIds: Types.ObjectId[],
  ): Promise<SolveAndWinContestDocument | null> {
    return await this.contestModel
      .findByIdAndUpdate(
        contestId,
        {
          $addToSet: {
            subjects: {
              $each: subjectIds.map((subjectId) => ({
                subjectId,
                questions: [],
              })),
            },
          },
        },
        {
          new: true,
          runValidators: true,
        },
      )
      .exec();
  }

  async removeSubjectsFromContest(
    contestId: Types.ObjectId,
    subjectIds: Types.ObjectId[],
  ): Promise<SolveAndWinContestDocument | null> {
    return await this.contestModel
      .findByIdAndUpdate(
        contestId,
        {
          $pull: {
            subjects: {
              subjectId: {
                $in: subjectIds,
              },
            },
          },
        },
        {
          new: true,
          runValidators: true,
        },
      )
      .exec();
  }

  // async addQuestionToSubject(
  //   contestId: Types.ObjectId,
  //   subjectId: Types.ObjectId,
  //   questionId: Types.ObjectId,
  // ): Promise<SolveAndWinContestDocument | null> {
  //   return await this.contestModel
  //     .findOneAndUpdate(
  //       {
  //         _id: contestId,
  //         subjects: {
  //           $elemMatch: {
  //             subjectId,
  //             'questions.questionId': {
  //               $ne: questionId,
  //             },
  //           },
  //         },
  //       },
  //       {
  //         $push: {
  //           'subjects.$.questions': {
  //             questionId,
  //           },
  //         },
  //       },
  //       {
  //         new: true,
  //         runValidators: true,
  //       },
  //     )
  //     .exec();
  // }

  async addQuestionsToSubject(
    contestId: Types.ObjectId,
    subjectId: Types.ObjectId,
    questionIds: Types.ObjectId[],
  ): Promise<SolveAndWinContestDocument | null> {
    if (!questionIds.length) {
      return await this.findSolveAndWinContestById(contestId);
    }

    return await this.contestModel
      .findOneAndUpdate(
        {
          _id: contestId,
          'subjects.subjectId': subjectId,
        },
        {
          $addToSet: {
            'subjects.$.questions': {
              $each: questionIds.map((questionId) => ({
                questionId,
              })),
            },
          },
        },
        {
          returnDocument: 'after',
          runValidators: true,
        },
      )
      .exec();
  }
  async addQuestionsToSubjectWithSession(
    contestId: Types.ObjectId,
    subjectId: Types.ObjectId,
    questionIds: Types.ObjectId[],
    session: ClientSession,
  ): Promise<SolveAndWinContestDocument | null> {
    return await this.contestModel
      .findOneAndUpdate(
        {
          _id: contestId,
          'subjects.subjectId': subjectId,
        },
        {
          $addToSet: {
            'subjects.$.questions': {
              $each: questionIds.map((questionId) => ({
                questionId,
              })),
            },
          },
        },
        {
          returnDocument: 'after',
          runValidators: true,
          session,
        },
      )
      .exec();
  }

  async addQuestionToSubject(
    contestId: Types.ObjectId,
    subjectId: Types.ObjectId,
    questionId: Types.ObjectId,
  ): Promise<SolveAndWinContestDocument | null> {
    return await this.contestModel
      .findOneAndUpdate(
        {
          _id: contestId,
          'subjects.subjectId': subjectId,
        },
        {
          $addToSet: {
            'subjects.$.questions': {
              questionId,
            },
          },
        },
        {
          new: true,
          runValidators: true,
        },
      )
      .exec();
  }

  async removeQuestionFromSubject(
    contestId: Types.ObjectId,
    subjectId: Types.ObjectId,
    questionId: Types.ObjectId,
  ): Promise<SolveAndWinContestDocument | null> {
    return await this.contestModel
      .findOneAndUpdate(
        {
          _id: contestId,
          'subjects.subjectId': subjectId,
        },
        {
          $pull: {
            'subjects.$.questions': {
              questionId,
            },
          },
        },
        {
          returnDocument: 'after',
          runValidators: true,
        },
      )
      .exec();
  }

  async removeQuestionsFromSubject(
    contestId: Types.ObjectId,
    subjectId: Types.ObjectId,
    questionIds: Types.ObjectId[],
  ): Promise<SolveAndWinContestDocument | null> {
    return await this.contestModel
      .findOneAndUpdate(
        {
          _id: contestId,
          'subjects.subjectId': subjectId,
        },
        {
          $pull: {
            'subjects.$.questions': {
              questionId: {
                $in: questionIds,
              },
            },
          },
        },
        {
          returnDocument: 'after',
          runValidators: true,
        },
      )
      .exec();
  }

  async getQuestionIdsBySubject(
    contestId: Types.ObjectId,
    subjectId: Types.ObjectId,
  ): Promise<Types.ObjectId[]> {
    const contest = await this.contestModel
      .findOne(
        {
          _id: contestId,
          'subjects.subjectId': subjectId,
        },
        {
          'subjects.$': 1,
        },
      )
      .lean()
      .exec();

    if (!contest || !contest.subjects?.length) {
      return [];
    }

    return contest.subjects[0].questions.map((question) => question.questionId);
  }

  async findSubjectInContest(
    contestId: Types.ObjectId,
    subjectId: Types.ObjectId,
  ) {
    return await this.contestModel
      .findOne(
        {
          _id: contestId,
          'subjects.subjectId': subjectId,
        },
        {
          subjects: {
            $elemMatch: {
              subjectId,
            },
          },
        },
      )
      .lean()
      .exec();
  }

  async checkSubjectExistInContest(
    contestId: Types.ObjectId,
    subjectId: Types.ObjectId,
  ): Promise<boolean> {
    const result = await this.contestModel.exists({
      _id: contestId,
      'subjects.subjectId': subjectId,
    });

    return !!result;
  }

  async checkQuestionExistInSubject(
    contestId: Types.ObjectId,
    subjectId: Types.ObjectId,
    questionId: Types.ObjectId,
  ): Promise<boolean> {
    const result = await this.contestModel.exists({
      _id: contestId,
      subjects: {
        $elemMatch: {
          subjectId,
          'questions.questionId': questionId,
        },
      },
    });

    return !!result;
  }

  async activateContest(
    contestId: Types.ObjectId,
  ): Promise<SolveAndWinContestDocument | null> {
    return await this.contestModel
      .findByIdAndUpdate(
        contestId,
        {
          $set: {
            isActive: true,
          },
        },
        {
          returnDocument: 'after',
          runValidators: true,
        },
      )
      .exec();
  }

  async deactivateContest(
    contestId: Types.ObjectId,
  ): Promise<SolveAndWinContestDocument | null> {
    return await this.contestModel
      .findByIdAndUpdate(
        contestId,
        {
          $set: {
            isActive: false,
          },
        },
        {
          returnDocument: 'after',
          runValidators: true,
        },
      )
      .exec();
  }

  async deleteContest(
    contestId: Types.ObjectId,
  ): Promise<SolveAndWinContestDocument | null> {
    return await this.contestModel.findByIdAndDelete(contestId).exec();
  }
}
