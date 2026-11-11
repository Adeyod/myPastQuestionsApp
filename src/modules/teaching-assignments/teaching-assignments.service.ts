import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Types } from 'mongoose';
import { AcademicSessionsService } from '../academic-sessions/academic-sessions.service';
import { ClassesService } from '../classes/classes.service';
import { SchoolRole } from '../school-memberships/schemas/school-membership.schema';
import { SchoolMembershipsService } from '../school-memberships/school-memberships.service';
import { SchoolSubjectsService } from '../school-subjects/school-subjects.service';
import {
  CreateTeachingAssignmentInput,
  TeachingAssignmentsRepository,
} from './repositories/teaching-assignments.repository';
import { TeachingAssignmentDocument } from './schemas/teaching-assignment.schema';

@Injectable()
export class TeachingAssignmentsService {
  constructor(
    @InjectConnection() private readonly connection: Connection,

    private readonly teachingAssignmentsRepository: TeachingAssignmentsRepository,

    private readonly schoolMembershipService: SchoolMembershipsService,
    private readonly classesService: ClassesService,
    private readonly academicSessionService: AcademicSessionsService,
    private readonly schoolSubjectsService: SchoolSubjectsService,
  ) {}

  async createTeachingAssignment(
    schoolId: string,
    data: {
      teacherMembershipId: string;
      classId: string;
      subjectId: string;
      academicSessionId: string;
    },
  ): Promise<TeachingAssignmentDocument> {
    this.validateObjectIds(data);

    const schoolObjectId = new Types.ObjectId(schoolId);

    const teacherMembershipId = new Types.ObjectId(data.teacherMembershipId);

    const classId = new Types.ObjectId(data.classId);

    const subjectId = new Types.ObjectId(data.subjectId);

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const teacherMembership =
        await this.schoolMembershipService.findSchoolMemberShipByUserIdSchoolIdAndRole(
          schoolObjectId,
          teacherMembershipId,
          SchoolRole.TEACHER,
          session,
        );

      const schoolClass = await this.classesService.getSchoolActiveClassById(
        schoolId,
        data.classId,
        session,
      );

      const subject =
        await this.schoolSubjectsService.getSchoolActiveSubjectById(
          schoolId,
          data.subjectId,
          session,
        );
      const isSubjectPartOfClass = schoolClass.subjects.some(
        (subject) => subject.toString() === subject._id.toString(),
      );

      if (!isSubjectPartOfClass) {
        throw new ConflictException({
          message: 'Subject not associated with this class.',
          success: false,
          status: 409,
        });
      }

      const classSubjectDetails = schoolClass.teacherSubjectAssignments.find(
        (item) => {
          const info = item.subject._id.toString() === subject._id.toString();
          return info;
        },
      );

      if (classSubjectDetails) {
        let msg = '';
        if (
          classSubjectDetails?.teacher?._id.toString() ===
          teacherMembership._id.toString()
        ) {
          msg = `This teacher has already being assigned to teach ${subject.subjectName} in this class.`;
        } else {
          msg = `A teacher has already being assigned to teach ${subject.subjectName} in the class.`;
        }

        throw new ConflictException({
          message: msg,
          success: false,
          status: 409,
        });
      }

      const academicSessionExist =
        await this.academicSessionService.getAcademicSessionByIdWithSession(
          schoolId,
          data.academicSessionId,
          session,
        );

      const assignmentData: CreateTeachingAssignmentInput = {
        schoolId: schoolObjectId,
        teacherMembershipId,
        classId,
        subjectId,
        academicSessionId: academicSessionExist._id,
      };

      const res =
        await this.teachingAssignmentsRepository.createTeachingAssignment(
          assignmentData,
          session,
        );

      teacherMembership.teachingAssignment.push({
        subject: subject._id,
        class: schoolClass._id,
      });

      schoolClass.teacherSubjectAssignments.push({
        teacher: teacherMembership._id,
        subject: subject._id,
      });

      await teacherMembership.save({ session });
      await schoolClass.save({ session });

      await session.commitTransaction();
      return res;
    } catch (error) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async getTeachingAssignment(
    schoolId: string,
    assignmentId: string,
  ): Promise<TeachingAssignmentDocument> {
    this.validateObjectId(assignmentId, 'assignmentId');

    const assignment =
      await this.teachingAssignmentsRepository.findTeachingAssignmentById(
        new Types.ObjectId(schoolId),
        new Types.ObjectId(assignmentId),
      );

    if (!assignment) {
      throw new NotFoundException({
        message: 'Teaching assignment not found.',
        success: false,
        status: 404,
      });
    }

    return assignment;
  }

  async deactivateTeachingAssignment(
    schoolId: string,
    assignmentId: string,
  ): Promise<TeachingAssignmentDocument> {
    this.validateObjectId(assignmentId, 'assignmentId');

    const assignment = await this.getTeachingAssignment(schoolId, assignmentId);

    if (!assignment.isActive) {
      return assignment;
    }

    const deactivatedAssignment =
      await this.teachingAssignmentsRepository.deactivateTeachingAssignment(
        new Types.ObjectId(schoolId),
        new Types.ObjectId(assignmentId),
      );

    if (!deactivatedAssignment) {
      throw new NotFoundException({
        message:
          'Teaching assignment could not be found or has already been deactivated.',
        success: false,
        status: 404,
      });
    }

    return deactivatedAssignment;
  }

  private validateObjectIds(data: {
    teacherMembershipId: string;
    classId: string;
    subjectId: string;
    academicSessionId: string;
  }): void {
    this.validateObjectId(data.teacherMembershipId, 'teacherMembershipId');

    this.validateObjectId(data.classId, 'classId');

    this.validateObjectId(data.subjectId, 'subjectId');

    this.validateObjectId(data.academicSessionId, 'academicSessionId');
  }

  private validateObjectId(value: string, fieldName: string): void {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException({
        message: `${fieldName} must be a valid MongoDB ObjectId.`,
        success: false,
        status: 400,
      });
    }
  }
}
