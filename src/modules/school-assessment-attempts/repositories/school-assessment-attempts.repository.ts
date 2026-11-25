import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { QueryWithPaginationDto } from '../../../common/dto/query-with-pagination';
import { AssessmentMarkingMode } from '../../school-assessments/schemas/school-assessment.schema';
import {
  AssessmentAttemptAnswer,
  AssessmentAttemptStatus,
  SchoolAssessmentAttempt,
  SchoolAssessmentAttemptDocument,
} from '../schemas/school-assessment-attempt.schema';

export interface AssessmentAttemptAnswerInput {
  questionId: Types.ObjectId;
  selectedOptionKeys: string[];
  textAnswer?: string;
  answeredAt: Date;
}

@Injectable()
export class SchoolAssessmentAttemptsRepository {
  constructor(
    @InjectModel(SchoolAssessmentAttempt.name)
    private readonly attemptModel: Model<SchoolAssessmentAttemptDocument>,
  ) {}

  async createAssessmentAttempt(
    data: Partial<SchoolAssessmentAttempt>,
  ): Promise<SchoolAssessmentAttemptDocument> {
    const attempt = new this.attemptModel(data);
    const response = await attempt.save();
    return response;
  }

  async findMyAttemptsInASession(
    studentMembershipId: Types.ObjectId,
    academicSessionId: Types.ObjectId,
    schoolId: Types.ObjectId,
    queryDto: QueryWithPaginationDto,
  ): Promise<{
    assessmentAttemptObj: SchoolAssessmentAttemptDocument[];
    totalCount: number;
    totalPages: number;
  }> {
    const filter: Record<string, any> = {
      academicSessionId,
      schoolId,
      studentMembershipId,
    };

    const { page, limit, searchParams } = queryDto;

    let query = this.attemptModel.find(filter);

    if (searchParams) {
      const regex = new RegExp(searchParams, 'i');

      query = query.where({
        $or: [
          { status: { $regex: regex } },
          { markingMode: { $regex: regex } },
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

    const assessments = await query.sort({ createdAt: -1 });

    if (assessments.length === 0) {
      throw new NotFoundException({
        message: 'Student assessments not found.',
        success: false,
        status: 404,
      });
    }

    const response = {
      totalCount: count,
      totalPages: pages,
      assessmentAttemptObj: assessments,
    };

    return response;
  }

  async findAttemptsByAssessmentAndClass(
    schoolId: Types.ObjectId,
    assessmentId: Types.ObjectId,
    classId: Types.ObjectId,
  ): Promise<SchoolAssessmentAttemptDocument[]> {
    const response = await this.attemptModel
      .find({
        schoolId,
        assessmentId,
        classId,
      })
      .sort({ createdAt: -1 })
      .exec();

    return response;
  }

  async findAttemptByAssessmentAndStudent(
    schoolId: Types.ObjectId,
    assessmentId: Types.ObjectId,
    studentMembershipId: Types.ObjectId,
  ): Promise<SchoolAssessmentAttemptDocument | null> {
    const response = await this.attemptModel
      .findOne({
        schoolId,
        assessmentId,
        studentMembershipId,
      })
      .exec();

    return response;
  }

  async findAttemptByAttemptId(
    schoolId: Types.ObjectId,
    attemptId: Types.ObjectId,
  ): Promise<SchoolAssessmentAttemptDocument | null> {
    const response = await this.attemptModel
      .findOne({
        _id: attemptId,
        schoolId,
      })
      .exec();
    return response;
  }
  async findAttemptById(
    schoolId: Types.ObjectId,
    attemptId: Types.ObjectId,
    studentMembershipId: Types.ObjectId,
  ): Promise<SchoolAssessmentAttemptDocument | null> {
    const response = await this.attemptModel
      .findOne({
        _id: attemptId,
        schoolId,
        studentMembershipId,
      })
      .exec();
    return response;
  }

  async updateAttemptAnswers(
    schoolId: Types.ObjectId,
    attemptId: Types.ObjectId,
    studentMembershipId: Types.ObjectId,
    answers: AssessmentAttemptAnswerInput[],
  ): Promise<SchoolAssessmentAttemptDocument | null> {
    const response = await this.attemptModel
      .findOneAndUpdate(
        {
          _id: attemptId,
          schoolId,
          studentMembershipId,
          status: AssessmentAttemptStatus.IN_PROGRESS,
        },
        {
          $set: { answers },
        },
        { returnDocument: 'after' },
      )
      .exec();

    return response;
  }

  async updateAttempt(
    schoolId: Types.ObjectId,
    attemptId: Types.ObjectId,
    studentMembershipId: Types.ObjectId,
    update: Partial<SchoolAssessmentAttempt>,
  ): Promise<SchoolAssessmentAttemptDocument | null> {
    const response = await this.attemptModel
      .findOneAndUpdate(
        {
          _id: attemptId,
          schoolId,
          studentMembershipId,
          status: AssessmentAttemptStatus.IN_PROGRESS,
        },
        { $set: update },
        { returnDocument: 'after' },
      )
      .exec();

    return response;
  }

  async markAssessmentAttempt(
    schoolId: Types.ObjectId,
    attemptId: Types.ObjectId,
    answers: AssessmentAttemptAnswer[],
    marksAwarded: number,
    score: number,
  ): Promise<SchoolAssessmentAttemptDocument | null> {
    const response = await this.attemptModel
      .findOneAndUpdate(
        {
          _id: attemptId,
          schoolId,
          status: AssessmentAttemptStatus.AWAITING_MARKING,
          markingMode: AssessmentMarkingMode.MANUAL,
        },
        {
          $set: {
            answers,
            marksAwarded,
            score,
            status: AssessmentAttemptStatus.MARKED,
            markedAt: new Date(),
          },
        },
        {
          new: true,
          runValidators: true,
        },
      )
      .exec();

    return response;
  }
}
