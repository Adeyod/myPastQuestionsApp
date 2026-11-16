import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Types } from 'mongoose';

import { QueryWithPaginationDto } from '../../common/dto/query-with-pagination';
import { AcademicSessionsService } from '../academic-sessions/academic-sessions.service';
import {
  SchoolMembershipDocument,
  SchoolRole,
} from '../school-memberships/schemas/school-membership.schema';
import { SchoolQuestionType } from '../school-questions/schemas/school-question.schema';
import { SchoolQuestionsService } from '../school-questions/school-questions.service';
import { StudentEnrollmentsService } from '../student-enrollments/student-enrollments.service';
import { TeachingAssignmentsService } from '../teaching-assignments/teaching-assignments.service';
import { CreateAssessmentDto } from './dtos/create-assessment.dto';
import { QueryAssessmentsDto } from './dtos/query-assessments.dto';
import { UpdateAssessmentStatusDto } from './dtos/update-assessment-status.dto';
import { SchoolAssessmentsRepository } from './repositories/school-assessments.repository';
import {
  AssessmentMarkingMode,
  AssessmentQuestion,
  AssessmentStatus,
  SchoolAssessmentDocument,
} from './schemas/school-assessment.schema';

@Injectable()
export class SchoolAssessmentsService {
  constructor(
    private readonly assessmentsRepository: SchoolAssessmentsRepository,
    private readonly questionBankService: SchoolQuestionsService,
    private readonly studentEnrollmentsService: StudentEnrollmentsService,
    private readonly academicSessionService: AcademicSessionsService,
    private readonly teachingAssignmentsService: TeachingAssignmentsService,

    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  async createAssessment(
    schoolId: string,
    teacherMembershipId: string,
    dto: CreateAssessmentDto,
  ) {
    const schoolObjectId = this.validateObjectId(schoolId, 'School ID');

    const teacherMembershipObjectId = this.validateObjectId(
      teacherMembershipId,
      'Teacher membership ID',
    );

    const subjectObjectId = this.validateObjectId(dto.subjectId, 'Subject ID');

    const academicSessionObjectId = this.validateObjectId(
      dto.academicSessionId,
      'Academic session ID',
    );

    if (dto.academicPeriodId) {
      this.validateObjectId(dto.academicPeriodId, 'Academic period ID');
    }

    const classIds = this.normalizeClassIds(dto.classIds);

    this.validateSchedule(dto);

    const totalMarks = dto.questions.reduce(
      (total, question) => total + question.marks,
      0,
    );

    if (dto.passMark !== undefined && dto.passMark > totalMarks) {
      throw new BadRequestException({
        message: 'Pass mark cannot be greater than the total marks.',
        success: false,
        status: 400,
      });
    }

    this.validateAssessmentQuestions(dto);

    const sessionExist =
      await this.academicSessionService.getAcademicSessionById(
        schoolId,
        academicSessionObjectId.toString(),
      );

    await this.teachingAssignmentsService.validateTeacherAssignments(
      schoolId,
      teacherMembershipId,
      subjectObjectId.toString(),
      classIds.map((id) => id.toString()),
      academicSessionObjectId.toString(),
    );

    const session = await this.connection.startSession();

    try {
      let createdAssessment: SchoolAssessmentDocument | null = null;

      await session.withTransaction(async () => {
        const assessment = await this.assessmentsRepository.createAssessment(
          schoolObjectId,
          teacherMembershipObjectId,
          {
            ...dto,
            classIds: classIds.map((id) => id.toString()),
          },
          totalMarks,
          session,
        );

        const questionBankQuestions =
          await this.questionBankService.createQuestionsForAssessment(
            schoolId,
            teacherMembershipId,
            {
              subjectId: subjectObjectId.toString(),
              classIds: classIds.map((id) => id.toString()),
              questions: dto.questions,
            },
            assessment._id.toString(),
            new Date(dto.endsAt),
            session,
          );

        const snapshots: AssessmentQuestion[] = questionBankQuestions.map(
          (question, index) => ({
            sourceQuestionId: question._id,
            order: index + 1,
            questionType: question.questionType,
            questionText: question.questionText,
            questionImages: question.questionImages ?? [],
            options: question.options ?? [],
            answerKey: question.answerKey ?? null,
            explanation: question.explanation ?? '',
            marks: dto.questions[index].marks,
          }),
        );

        createdAssessment =
          await this.assessmentsRepository.attachQuestionSnapshots(
            assessment,
            snapshots,
            session,
          );
      });

      return createdAssessment;
    } finally {
      await session.endSession();
    }
  }

  async getAllSchoolAssessmentsPerSession(
    academicSessionId: string,
    schoolId: string,
    query: QueryAssessmentsDto,
  ) {
    const schoolObjectId = this.validateObjectId(schoolId, 'School ID');

    if (query.subjectId) {
      this.validateObjectId(query.subjectId, 'Subject ID');
    }

    if (query.classId) {
      this.validateObjectId(query.classId, 'Class ID');
    }

    if (query.academicSessionId) {
      this.validateObjectId(query.academicSessionId, 'Academic session ID');
    }

    const sessionExist =
      await this.academicSessionService.getAcademicSessionById(
        schoolId,
        academicSessionId,
      );

    const response =
      await this.assessmentsRepository.getAllSchoolAssessmentsPerSession(
        schoolObjectId,
        query,
        sessionExist._id,
      );

    return response;
  }
  async getAllClassSubjectAssessmentsPerSession(
    academicSessionId: string,
    subjectId: string,
    classId: string,
    schoolId: string,
    query: QueryWithPaginationDto,
    membership: SchoolMembershipDocument,
  ) {
    const schoolObjectId = this.validateObjectId(schoolId, 'School ID');

    this.validateObjectId(subjectId, 'Subject ID');

    const sessionExist =
      await this.academicSessionService.getAcademicSessionById(
        schoolId,
        academicSessionId,
      );

    if (membership.role === SchoolRole.TEACHER) {
      await this.teachingAssignmentsService.validateTeacherAssignments(
        schoolId,
        membership._id.toString(),
        subjectId,
        [classId],
        sessionExist._id.toString(),
      );
    }

    if ((membership.role = SchoolRole.STUDENT)) {
      await this.studentEnrollmentsService.validateStudentSubjectEnrollment(
        schoolId,
        membership._id.toString(),
        classId,
        subjectId,
        academicSessionId,
      );
    }

    const response =
      await this.assessmentsRepository.getAllClassSubjectAssessmentsPerSession(
        schoolObjectId,
        sessionExist._id,
        new Types.ObjectId(subjectId),
        new Types.ObjectId(classId),
        query,
      );

    return response;
  }

  async getAssessmentByAssessmentId(
    schoolId: string,
    assessmentId: string,
    membership: SchoolMembershipDocument,
    academicSessionId: string,
    classId: string,
  ) {
    const schoolObjectId = this.validateObjectId(schoolId, 'School ID');

    const assessmentObjectId = this.validateObjectId(
      assessmentId,
      'Assessment ID',
    );

    const sessionExist =
      await this.academicSessionService.getAcademicSessionById(
        schoolId,
        academicSessionId,
      );

    const assessment = await this.assessmentsRepository.findAssessmentById(
      schoolObjectId,
      assessmentObjectId,
    );

    if (!assessment) {
      throw new NotFoundException({
        message: 'Assessment not found.',
        success: false,
        status: 404,
      });
    }

    if (membership.role === SchoolRole.TEACHER) {
      await this.teachingAssignmentsService.validateTeacherAssignments(
        schoolId,
        membership._id.toString(),
        assessment.subjectId.toString(),
        [classId],
        sessionExist._id.toString(),
      );
    }

    if ((membership.role = SchoolRole.STUDENT)) {
      await this.studentEnrollmentsService.validateStudentSubjectEnrollment(
        schoolId,
        membership._id.toString(),
        classId,
        assessment.subjectId.toString(),
        academicSessionId,
      );
    }

    return assessment;
  }

  async updateAssessmentStatus(
    schoolId: string,
    assessmentId: string,
    dto: UpdateAssessmentStatusDto,
  ) {
    if (dto.status !== AssessmentStatus.ARCHIVED) {
      throw new BadRequestException({
        message: 'Only archiving an assessment is supported by this endpoint.',
        success: false,
        status: 400,
      });
    }

    const schoolObjectId = this.validateObjectId(schoolId, 'School ID');

    const assessmentObjectId = this.validateObjectId(
      assessmentId,
      'Assessment ID',
    );

    const assessment = await this.assessmentsRepository.archiveAssessment(
      schoolObjectId,
      assessmentObjectId,
    );

    if (!assessment) {
      throw new NotFoundException({
        message: 'Assessment not found or already archived.',
        success: false,
        status: 404,
      });
    }

    return assessment;
  }

  private validateSchedule(dto: CreateAssessmentDto) {
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);
    const now = new Date();

    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      throw new BadRequestException({
        message: 'Invalid assessment start or end date.',
        success: false,
        status: 400,
      });
    }

    if (startsAt.getTime() <= now.getTime()) {
      throw new BadRequestException({
        message: 'Assessment start time must be in the future.',
        success: false,
        status: 400,
      });
    }

    if (endsAt.getTime() <= startsAt.getTime()) {
      throw new BadRequestException({
        message: 'Assessment end time must be later than its start time.',
        success: false,
        status: 400,
      });
    }

    const availableWindowMinutes =
      (endsAt.getTime() - startsAt.getTime()) / 60000;

    if (availableWindowMinutes < dto.durationMinutes) {
      throw new BadRequestException({
        message:
          'The assessment availability window cannot be shorter than its duration.',
        success: false,
        status: 400,
      });
    }
  }

  private validateAssessmentQuestions(dto: CreateAssessmentDto) {
    if (!dto.questions?.length) {
      throw new BadRequestException({
        message: 'At least one assessment question is required.',
        success: false,
        status: 400,
      });
    }

    for (const [index, question] of dto.questions.entries()) {
      const label = `Question ${index + 1}`;

      if (!question.questionText?.trim()) {
        throw new BadRequestException({
          message: `${label}: question text is required.`,
          success: false,
          status: 400,
        });
      }

      if (!Number.isFinite(question.marks) || question.marks < 1) {
        throw new BadRequestException({
          message: `${label}: marks must be at least 1.`,
          success: false,
          status: 400,
        });
      }

      const options = question.options ?? [];
      const optionKeys = options.map((option) =>
        option.key.trim().toUpperCase(),
      );

      if (new Set(optionKeys).size !== optionKeys.length) {
        throw new BadRequestException({
          message: `${label}: option keys must be unique.`,
          success: false,
          status: 400,
        });
      }

      const answerKey = question.answerKey;

      if (
        [
          SchoolQuestionType.SINGLE_CHOICE,
          SchoolQuestionType.MULTIPLE_CHOICE,
        ].includes(question.questionType)
      ) {
        if (options.length < 2) {
          throw new BadRequestException({
            message: `${label}: at least two options are required.`,
            success: false,
            status: 400,
          });
        }
      }

      if (this.requiresAutomaticAnswer(dto.markingMode)) {
        if (!answerKey) {
          throw new BadRequestException({
            message: `${label}: an answer key is required for automatic marking.`,
            success: false,
            status: 400,
          });
        }

        switch (question.questionType) {
          case SchoolQuestionType.SINGLE_CHOICE:
            if (
              !answerKey.correctOptionKey ||
              !optionKeys.includes(
                answerKey.correctOptionKey.trim().toUpperCase(),
              )
            ) {
              throw new BadRequestException({
                message: `${label}: provide a valid correct option.`,
                success: false,
                status: 400,
              });
            }
            break;

          case SchoolQuestionType.MULTIPLE_CHOICE: {
            const correctKeys =
              answerKey.correctOptionKeys?.map((key) =>
                key.trim().toUpperCase(),
              ) ?? [];

            if (
              correctKeys.length === 0 ||
              new Set(correctKeys).size !== correctKeys.length ||
              correctKeys.some((key) => !optionKeys.includes(key))
            ) {
              throw new BadRequestException({
                message: `${label}: provide valid correct option keys.`,
                success: false,
                status: 400,
              });
            }
            break;
          }

          case SchoolQuestionType.TRUE_FALSE:
            if (typeof answerKey.correctBoolean !== 'boolean') {
              throw new BadRequestException({
                message: `${label}: a true/false answer is required.`,
                success: false,
                status: 400,
              });
            }
            break;

          case SchoolQuestionType.SHORT_ANSWER:
            if (!answerKey.acceptedAnswers?.some((answer) => answer.trim())) {
              throw new BadRequestException({
                message: `${label}: at least one accepted answer is required.`,
                success: false,
                status: 400,
              });
            }
            break;

          case SchoolQuestionType.ESSAY:
            throw new BadRequestException({
              message: `${label}: essay questions require manual marking.`,
              success: false,
              status: 400,
            });
        }
      }
    }
  }

  private requiresAutomaticAnswer(markingMode: AssessmentMarkingMode): boolean {
    return markingMode === AssessmentMarkingMode.AUTOMATIC;
  }

  private normalizeClassIds(classIds: string[]): Types.ObjectId[] {
    if (!Array.isArray(classIds) || classIds.length === 0) {
      throw new BadRequestException({
        message: 'At least one class must be selected.',
        success: false,
        status: 400,
      });
    }

    const uniqueIds = [...new Set(classIds)];

    if (uniqueIds.length !== classIds.length) {
      throw new BadRequestException({
        message: 'Duplicate class IDs are not allowed.',
        success: false,
        status: 400,
      });
    }

    return uniqueIds.map((id) => this.validateObjectId(id, 'Class ID'));
  }

  private validateObjectId(value: string, fieldName: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException({
        message: `Invalid ${fieldName}.`,
        success: false,
        status: 400,
      });
    }

    return new Types.ObjectId(value);
  }
}
