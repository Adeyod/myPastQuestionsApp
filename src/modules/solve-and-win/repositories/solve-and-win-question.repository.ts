import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { ClientSession } from 'mongoose';
import { QueryWithPaginationDto } from '../../../common/dto/query-with-pagination';
import {
  SolveAndWinQuestion,
  SolveAndWinQuestionDocument,
} from '../schemas/solve-and-win-question.schema';

@Injectable()
export class SolveAndWinQuestionRepository {
  constructor(
    @InjectModel(SolveAndWinQuestion.name)
    private readonly questionModel: Model<SolveAndWinQuestionDocument>,
  ) {}

  async createManySolveAndWinQuestions(
    questions: Partial<SolveAndWinQuestion>[],
    session?: ClientSession,
  ): Promise<SolveAndWinQuestionDocument[]> {
    const response = await this.questionModel.insertMany(questions, {
      session,
    });

    return response;
  }

  async createSolveAndWinQuestion(
    data: Partial<SolveAndWinQuestion>,
  ): Promise<SolveAndWinQuestionDocument> {
    const question = new this.questionModel(data);

    return await question.save();
  }

  async findSolveAndWinQuestionById(
    questionId: Types.ObjectId,
  ): Promise<SolveAndWinQuestionDocument | null> {
    const id = new Types.ObjectId(questionId);

    const response = await this.questionModel.findById(id).exec();
    return response;
  }

  async findActiveSolveAndWinQuestionById(
    questionId: Types.ObjectId,
  ): Promise<SolveAndWinQuestionDocument | null> {
    const id = new Types.ObjectId(questionId);

    const response = await this.questionModel
      .findOne({
        _id: id,
        isActive: true,
      })
      .exec();

    return response;
  }

  async findAll(queryDto: QueryWithPaginationDto): Promise<{
    totalCount: number;
    totalPages: number;
    solveAndWinQuestionObj: SolveAndWinQuestionDocument[];
  }> {
    const { page, limit, searchParams } = queryDto;
    let query = this.questionModel.find();

    if (searchParams) {
      const regex = new RegExp(searchParams, 'i');

      query = query.where({
        $or: [
          { questionType: { $regex: regex } },
          { explanation: { $regex: regex } },
        ],
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

    const questions = await query.sort({ createdAt: -1 });

    if (questions.length === 0) {
      throw new NotFoundException({
        message: 'Questions not found.',
        status: 404,
        success: false,
      });
    }

    const response = {
      totalCount: count,
      totalPages: pages,
      solveAndWinQuestionObj: questions,
    };
    return response;
  }

  async findAllActive(queryDto: QueryWithPaginationDto): Promise<{
    totalCount: number;
    totalPages: number;
    solveAndWinQuestionObj: SolveAndWinQuestionDocument[];
  }> {
    const { page, limit, searchParams } = queryDto;
    let query = this.questionModel.find({ isActive: true });

    if (searchParams) {
      const regex = new RegExp(searchParams, 'i');

      query = query.where({
        $or: [
          { questionType: { $regex: regex } },
          { explanation: { $regex: regex } },
        ],
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

    const questions = await query.sort({ createdAt: -1 });

    if (questions.length === 0) {
      throw new NotFoundException({
        message: 'Questions not found.',
        status: 404,
        success: false,
      });
    }

    const response = {
      totalCount: count,
      totalPages: pages,
      solveAndWinQuestionObj: questions,
    };
    return response;
  }

  async findSolveAndWinQuestionsBySubjectId(
    subjectId: Types.ObjectId,
    queryDto: QueryWithPaginationDto,
  ): Promise<{
    totalCount: number;
    totalPages: number;
    solveAndWinQuestionObj: SolveAndWinQuestionDocument[];
  }> {
    const { page, limit, searchParams } = queryDto;
    let query = this.questionModel.find({ subjectId, isActive: true });

    if (searchParams) {
      const regex = new RegExp(searchParams, 'i');

      query = query.where({
        $or: [
          { questionType: { $regex: regex } },
          { explanation: { $regex: regex } },
        ],
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

    const questions = await query.sort({ createdAt: -1 });

    if (questions.length === 0) {
      throw new NotFoundException({
        message: 'Questions not found.',
        status: 404,
        success: false,
      });
    }

    const response = {
      totalCount: count,
      totalPages: pages,
      solveAndWinQuestionObj: questions,
    };
    return response;
  }

  async findSolveAndWinQuestionsByIds(
    questionIds: Types.ObjectId[],
  ): Promise<SolveAndWinQuestionDocument[]> {
    return await this.questionModel
      .find({
        _id: {
          $in: questionIds,
        },
        isActive: true,
      })
      .exec();
  }

  async checkQuestionExistsByQuestionId(
    questionId: Types.ObjectId,
  ): Promise<boolean> {
    const question = await this.questionModel.exists({
      _id: questionId,
      isActive: true,
    });

    return !!question;
  }

  async updateSolveAndWinQuestionById(
    questionId: Types.ObjectId,
    data: Partial<SolveAndWinQuestion>,
  ): Promise<SolveAndWinQuestionDocument | null> {
    return await this.questionModel
      .findByIdAndUpdate(
        questionId,
        {
          $set: data,
        },
        {
          returnDocument: 'after',
          runValidators: true,
        },
      )
      .exec();
  }

  async softDeleteSolveAndWinQuestionById(
    questionId: Types.ObjectId,
  ): Promise<SolveAndWinQuestionDocument | null> {
    return await this.questionModel
      .findOneAndUpdate(
        {
          _id: questionId,
          isActive: true,
        },
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

  async reActivateSoftDeletedQuestion(
    questionId: Types.ObjectId,
  ): Promise<SolveAndWinQuestionDocument | null> {
    return await this.questionModel
      .findByIdAndUpdate(
        questionId,
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

  async delete(
    questionId: Types.ObjectId,
  ): Promise<SolveAndWinQuestionDocument | null> {
    return await this.questionModel.findByIdAndDelete(questionId).exec();
  }
}
