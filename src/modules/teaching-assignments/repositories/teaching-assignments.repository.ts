import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import {
  TeachingAssignment,
  TeachingAssignmentDocument,
} from '../schemas/teaching-assignment.schema';

export interface TeachingAssignmentFilters {
  teacherMembershipId?: string;
  classId?: string;
  subjectId?: string;
  academicSessionId?: string;
  isActive?: boolean;
}

export interface CreateTeachingAssignmentInput {
  schoolId: Types.ObjectId;
  teacherMembershipId: Types.ObjectId;
  classId: Types.ObjectId;
  subjectId: Types.ObjectId;
  academicSessionId: Types.ObjectId;
}

@Injectable()
export class TeachingAssignmentsRepository {
  constructor(
    @InjectModel(TeachingAssignment.name)
    private readonly teachingAssignmentModel: Model<TeachingAssignment>,
  ) {}

  async createTeachingAssignment(
    data: CreateTeachingAssignmentInput,
    session: ClientSession,
  ): Promise<TeachingAssignmentDocument> {
    const response = await new this.teachingAssignmentModel(data).save({
      session,
    });

    return response;
  }

  async findTeachingAssignmentById(
    schoolId: Types.ObjectId,
    assignmentId: Types.ObjectId,
  ): Promise<TeachingAssignmentDocument | null> {
    const response = await this.teachingAssignmentModel
      .findOne({
        _id: assignmentId,
        schoolId,
      })
      .exec();

    return response;
  }

  async findActiveClassSubjectTeachingAssignment(
    schoolId: Types.ObjectId,
    classId: Types.ObjectId,
    subjectId: Types.ObjectId,
  ): Promise<TeachingAssignmentDocument | null> {
    const response = await this.teachingAssignmentModel
      .findOne({
        schoolId,
        classId,
        subjectId,
      })
      .exec();

    return response;
  }
  async findActiveTeachingAssignment(
    schoolId: Types.ObjectId,
    teacherMembershipId: Types.ObjectId,
    classId: Types.ObjectId,
    subjectId: Types.ObjectId,
    academicSessionId: Types.ObjectId,
  ): Promise<TeachingAssignmentDocument | null> {
    const response = await this.teachingAssignmentModel
      .findOne({
        schoolId,
        teacherMembershipId,
        classId,
        subjectId,
        academicSessionId,
        isActive: true,
      })
      .exec();

    return response;
  }

  async findTeachingAssignments(
    schoolId: Types.ObjectId,
    filters: TeachingAssignmentFilters = {},
  ): Promise<TeachingAssignmentDocument[]> {
    const query: Record<string, unknown> = {
      schoolId,
    };

    if (filters.teacherMembershipId) {
      query.teacherMembershipId = filters.teacherMembershipId;
    }

    if (filters.classId) {
      query.classId = filters.classId;
    }

    if (filters.subjectId) {
      query.subjectId = filters.subjectId;
    }

    if (filters.academicSessionId) {
      query.academicSessionId = filters.academicSessionId;
    }

    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    const response = await this.teachingAssignmentModel
      .find(query)
      .sort({ createdAt: -1 })
      .exec();

    return response;
  }

  async deactivateTeachingAssignment(
    schoolId: Types.ObjectId,
    assignmentId: Types.ObjectId,
  ): Promise<TeachingAssignmentDocument | null> {
    const response = await this.teachingAssignmentModel
      .findOneAndUpdate(
        {
          _id: assignmentId,
          schoolId,
          isActive: true,
        },
        {
          $set: {
            isActive: false,
          },
        },
        {
          returnDocument: 'after',
        },
      )
      .exec();

    return response;
  }
}
