import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { QueryWithPaginationDto } from '../../../common/dto/query-with-pagination';
import { CreateQuizDto } from '../dtos/create-quiz.dto';
import { Quiz, QuizDocument } from '../schemas/quiz.schema';

@Injectable()
export class QuizRepository {
  constructor(@InjectModel(Quiz.name) private quizModel: Model<QuizDocument>) {}

  async createQuiz(createQuizDto: CreateQuizDto): Promise<QuizDocument> {
    const createdQuiz = new this.quizModel({
      ...createQuizDto,
      subject: new Types.ObjectId(createQuizDto.subject),
      start_date: new Date(createQuizDto.start_date),
    });
    return await createdQuiz.save();
  }

  async findQuizById(id: Types.ObjectId): Promise<QuizDocument | null> {
    const response = await this.quizModel.findById(id).exec();

    return response;
  }

  async findAll(): Promise<QuizDocument[]> {
    const response = await this.quizModel.find().exec();

    return response;
  }
  async findAllQuizzes(queryDto: QueryWithPaginationDto): Promise<{
    totalCount: number;
    totalPages: number;
    quizzesObj: QuizDocument[];
  }> {
    const { page, limit, searchParams } = queryDto;
    let query = this.quizModel.find();

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

    const quizzes = await query
      .populate('subject', 'name')
      .sort({ createdAt: -1 });

    if (quizzes.length === 0) {
      throw new NotFoundException({
        message: 'Quizzes not found.',
        success: false,
        status: 404,
      });
    }

    const response = {
      totalCount: count,
      totalPages: pages,
      quizzesObj: quizzes,
    };

    return response;
  }
  async findAllMyQuizzes(
    userId: Types.ObjectId,
    queryDto: QueryWithPaginationDto,
  ): Promise<{
    totalCount: number;
    totalPages: number;
    quizzesObj: QuizDocument[];
  }> {
    const { page, limit, searchParams } = queryDto;
    let query = this.quizModel.find();

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

    const quizzes = await query
      .populate('subject', 'name')
      .sort({ createdAt: -1 });

    if (quizzes.length === 0) {
      throw new NotFoundException({
        message: 'Quizzes not found.',
        success: false,
        status: 404,
      });
    }

    const response = {
      totalCount: count,
      totalPages: pages,
      quizzesObj: quizzes,
    };

    return response;
  }
}
