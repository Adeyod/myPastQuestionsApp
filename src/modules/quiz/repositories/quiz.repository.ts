import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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
}
