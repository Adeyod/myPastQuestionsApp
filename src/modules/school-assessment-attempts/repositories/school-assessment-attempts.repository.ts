import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
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
}
