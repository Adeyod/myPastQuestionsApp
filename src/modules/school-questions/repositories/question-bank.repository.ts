import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';

import { CreateSchoolQuestionItemDto } from '../dtos/create-question.dto';
import { QuerySchoolQuestionsDto } from '../dtos/query-questions.dto';
import {
  SchoolQuestion,
  SchoolQuestionDifficulty,
  SchoolQuestionDocument,
  SchoolQuestionSource,
} from '../schemas/school-question.schema';

@Injectable()
export class QuestionBankRepository {
  constructor(
    @InjectModel(SchoolQuestion.name)
    private readonly questionModel: Model<SchoolQuestionDocument>,
  ) {}

  async createQuestions(
    schoolId: Types.ObjectId,
    subjectId: Types.ObjectId,
    classIds: Types.ObjectId[],
    createdByMembershipId: Types.ObjectId,
    questions: CreateSchoolQuestionItemDto[],
    practiceAvailableAt: Date,
    session?: ClientSession,
    sourceAssessmentId?: Types.ObjectId,
  ) {
    const documents = questions.map((question) => ({
      schoolId,
      subjectId,
      classIds,
      createdByMembershipId,
      source: sourceAssessmentId
        ? SchoolQuestionSource.ASSESSMENT
        : SchoolQuestionSource.DIRECT,
      sourceAssessmentId: sourceAssessmentId ?? null,
      practiceAvailableAt,
      questionType: question.questionType,
      questionText: question.questionText.trim(),
      questionImages: question.questionImages ?? [],
      options: question.options ?? [],
      answerKey: question.answerKey ?? null,
      difficulty: question.difficulty ?? SchoolQuestionDifficulty.MEDIUM,
      topic: question.topic?.trim() ?? '',
      explanation: question.explanation?.trim() ?? '',
      isActive: true,
    }));

    const response = await this.questionModel.insertMany(documents, {
      session,
      ordered: true,
    });

    return response;
  }

  async findAllQuestions(
    schoolId: Types.ObjectId,
    query: QuerySchoolQuestionsDto,
  ) {
    const filter: Record<string, any> = { schoolId };

    if (query.subjectId) {
      filter.subjectId = new Types.ObjectId(query.subjectId);
    }

    if (query.classId) {
      filter.classIds = new Types.ObjectId(query.classId);
    }

    if (query.questionType) {
      filter.questionType = query.questionType;
    }

    if (query.difficulty) {
      filter.difficulty = query.difficulty;
    }

    if (query.topic) {
      filter.topic = {
        $regex: this.escapeRegex(query.topic),
        $options: 'i',
      };
    }

    if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
    }

    if (query.searchParams?.trim()) {
      const search = this.escapeRegex(query.searchParams.trim());

      filter.$or = [
        { questionText: { $regex: search, $options: 'i' } },
        { topic: { $regex: search, $options: 'i' } },
      ];
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const [questionsObj, totalCount] = await Promise.all([
      this.questionModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),

      this.questionModel.countDocuments(filter),
    ]);

    return {
      questionsObj,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
    };
  }

  async getSpecificNoOfSubjectQuestions(
    schoolId: Types.ObjectId,
    subjectId: Types.ObjectId,
    classId: Types.ObjectId,
    quantity: number,
  ): Promise<SchoolQuestionDocument[]> {
    const response = await this.questionModel.aggregate([
      {
        $match: {
          schoolId,
          subjectId,
          classIds: classId,
          isActive: true,
          practiceAvailableAt: { $lte: new Date() },
        },
      },
      {
        $sample: {
          size: quantity,
        },
      },
      {
        $project: {
          answerKey: 0,
          explanation: 0,
        },
      },
    ]);

    return response;
  }

  async findQuestionById(
    schoolId: Types.ObjectId,
    questionId: Types.ObjectId,
  ): Promise<SchoolQuestionDocument | null> {
    const response = await this.questionModel.findOne({
      _id: questionId,
      schoolId,
    });

    return response;
  }

  async updateQuestionStatus(
    schoolId: Types.ObjectId,
    questionId: Types.ObjectId,
    isActive: boolean,
  ): Promise<SchoolQuestionDocument | null> {
    const response = await this.questionModel.findOneAndUpdate(
      { _id: questionId, schoolId },
      { $set: { isActive } },
      { returnDocument: 'after', runValidators: true },
    );

    return response;
  }

  async findQuestionsForPractice(
    schoolId: Types.ObjectId,
    subjectId: Types.ObjectId,
    classId: Types.ObjectId,
    questionCount: number,
    difficulty?: string,
  ): Promise<SchoolQuestionDocument[] | null> {
    const match: Record<string, any> = {
      schoolId,
      subjectId,
      classIds: classId,
      isActive: true,
      practiceAvailableAt: { $lte: new Date() },
    };

    if (difficulty) {
      match.difficulty = difficulty;
    }

    const response = await this.questionModel.aggregate([
      { $match: match },
      { $sample: { size: questionCount } },
      {
        $project: {
          answerKey: 0,
          explanation: 0,
        },
      },
    ]);

    return response;
  }

  async countAvailablePracticeQuestions(
    schoolId: Types.ObjectId,
    subjectId: Types.ObjectId,
    classId: Types.ObjectId,
    difficulty?: string,
  ): Promise<number> {
    const filter: Record<string, any> = {
      schoolId,
      subjectId,
      classIds: classId,
      isActive: true,
      practiceAvailableAt: { $lte: new Date() },
    };

    if (difficulty) {
      filter.difficulty = difficulty;
    }

    const response = await this.questionModel.countDocuments(filter);

    return response;
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
