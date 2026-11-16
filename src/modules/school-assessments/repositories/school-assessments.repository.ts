import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { QueryWithPaginationDto } from '../../../common/dto/query-with-pagination';
import { CreateAssessmentDto } from '../dtos/create-assessment.dto';
import { QueryAssessmentsDto } from '../dtos/query-assessments.dto';
import {
  AssessmentStatus,
  SchoolAssessment,
  SchoolAssessmentDocument,
} from '../schemas/school-assessment.schema';

@Injectable()
export class SchoolAssessmentsRepository {
  constructor(
    @InjectModel(SchoolAssessment.name)
    private readonly assessmentModel: Model<SchoolAssessmentDocument>,
  ) {}

  async createAssessment(
    schoolId: Types.ObjectId,
    teacherMembershipId: Types.ObjectId,
    payload: CreateAssessmentDto,
    totalMarks: number,
    session: ClientSession,
  ): Promise<SchoolAssessmentDocument> {
    const assessment = new this.assessmentModel({
      schoolId,
      teacherMembershipId,
      subjectId: new Types.ObjectId(payload.subjectId),
      classIds: payload.classIds.map((id) => new Types.ObjectId(id)),
      academicSessionId: new Types.ObjectId(payload.academicSessionId),
      academicPeriodId: payload.academicPeriodId
        ? new Types.ObjectId(payload.academicPeriodId)
        : null,
      title: payload.title.trim(),
      description: payload.description?.trim() ?? '',
      instructions: payload.instructions?.trim() ?? '',
      assessmentType: payload.assessmentType,
      markingMode: payload.markingMode,
      durationMinutes: payload.durationMinutes,
      totalMarks,
      passMark: payload.passMark ?? 0,
      startsAt: new Date(payload.startsAt),
      endsAt: new Date(payload.endsAt),
      attemptsAllowed: 1,
      questions: [],
    });

    const response = await assessment.save({ session });

    return response;
  }

  async findAssessmentById(
    schoolId: Types.ObjectId,
    assessmentId: Types.ObjectId,
  ): Promise<SchoolAssessmentDocument | null> {
    const response = await this.assessmentModel.findOne({
      _id: assessmentId,
      schoolId,
    });

    return response;
  }

  async getAllSchoolAssessmentsPerSession(
    schoolId: Types.ObjectId,
    query: QueryAssessmentsDto,
    academicSessionId: Types.ObjectId,
  ) {
    const filter: Record<string, any> = { schoolId, academicSessionId };

    if (query.subjectId) {
      filter.subjectId = new Types.ObjectId(query.subjectId);
    }

    if (query.classId) {
      filter.classIds = new Types.ObjectId(query.classId);
    }

    if (query.academicSessionId) {
      filter.academicSessionId = new Types.ObjectId(query.academicSessionId);
    }

    if (query.assessmentType) {
      filter.assessmentType = query.assessmentType;
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.searchParams?.trim()) {
      const search = this.escapeRegex(query.searchParams.trim());

      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const [assessmentsObj, totalCount] = await Promise.all([
      this.assessmentModel
        .find(filter)
        .select('-questions.answerKey')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),

      this.assessmentModel.countDocuments(filter),
    ]);

    return {
      assessmentsObj,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
    };
  }
  async getAllClassSubjectAssessmentsPerSession(
    schoolId: Types.ObjectId,
    academicSessionId: Types.ObjectId,
    subjectId: Types.ObjectId,
    classId: Types.ObjectId,
    queryDto: QueryWithPaginationDto,
  ): Promise<{
    assessmentObj: SchoolAssessmentDocument[] | null;
    totalPages: number;
    totalCount: number;
  }> {
    const filter: Record<string, any> = {
      schoolId,
      academicSessionId,
      subjectId,
      classIds: classId,
    };
    const { page, limit, searchParams } = queryDto;

    let query = this.assessmentModel.find(filter);

    if (searchParams) {
      const regex = new RegExp(searchParams, 'i');

      const isBooleanSearch =
        searchParams.toLowerCase() === 'true' ||
        searchParams.toLowerCase() === 'false';

      query = query.where({
        $or: [
          { status: { $regex: regex } },
          { title: { $regex: regex } },
          { description: { $regex: regex } },
          { instructions: { $regex: regex } },
          { assessmentType: { $regex: regex } },
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
        message: 'assessments not found.',
        success: false,
        status: 404,
      });
    }

    const response = {
      totalCount: count,
      totalPages: pages,
      assessmentObj: assessments,
    };

    return response;
  }

  async archiveAssessment(
    schoolId: Types.ObjectId,
    assessmentId: Types.ObjectId,
  ) {
    const response = await this.assessmentModel.findOneAndUpdate(
      {
        _id: assessmentId,
        schoolId,
        status: { $ne: AssessmentStatus.ARCHIVED },
      },
      {
        $set: {
          status: AssessmentStatus.ARCHIVED,
        },
      },
      {
        returnDocument: 'after',
        runValidators: true,
      },
    );

    return response;
  }

  async attachQuestionSnapshots(
    assessment: SchoolAssessmentDocument,
    questions: SchoolAssessment['questions'],
    session: ClientSession,
  ): Promise<SchoolAssessmentDocument | null> {
    assessment.questions = questions;
    const response = await assessment.save({ session });

    return response;
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
