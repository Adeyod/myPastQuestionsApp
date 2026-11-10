import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';

import { CreateStudentEnrollmentDto } from './dtos/create-student-enrollment.dto';
import { UpdateStudentEnrollmentStatusDto } from './dtos/update-student-enrollment-status.dto';
import { UpdateStudentEnrollmentDto } from './dtos/update-student-enrollment.dto';

import { StudentEnrollmentStatus } from './schemas/student-enrollment.schema';

import { QueryWithPaginationDto } from '../../common/dto/query-with-pagination';
import { AcademicSessionsService } from '../academic-sessions/academic-sessions.service';
import { AcademicSessionStatus } from '../academic-sessions/schemas/academic-session.schema';
import { ClassesService } from '../classes/classes.service';
import {
  SchoolMembership,
  SchoolRole,
} from '../school-memberships/schemas/school-membership.schema';
import { StudentEnrollmentsRepository } from './repositories/student-enrollments.repository';

@Injectable()
export class StudentEnrollmentsService {
  constructor(
    private readonly studentEnrollmentsRepository: StudentEnrollmentsRepository,
    private readonly classesService: ClassesService,
    private readonly academicSessionsService: AcademicSessionsService,

    @InjectModel(SchoolMembership.name)
    private readonly schoolMembershipModel: Model<SchoolMembership>,
  ) {}

  async createStudentEnrollment(
    schoolId: string,
    academicSessionId: string,
    createDto: CreateStudentEnrollmentDto,
  ) {
    this.validateObjectId(schoolId, 'school ID');
    this.validateObjectId(academicSessionId, 'academic session ID');
    this.validateObjectId(createDto.schoolMembershipId, 'school membership ID');
    this.validateObjectId(createDto.classId, 'class ID');

    const session = await this.findSessionOrThrow(schoolId, academicSessionId);

    if (session.status === AcademicSessionStatus.COMPLETED) {
      throw new BadRequestException({
        message:
          'Students cannot be enrolled into a completed academic session.',
        success: false,
        status: 400,
      });
    }

    const membership = await this.findMembershipOrThrow(
      schoolId,
      createDto.schoolMembershipId,
    );

    await this.findClassOrThrow(schoolId, createDto.classId);

    const existingEnrollment =
      await this.studentEnrollmentsRepository.findActiveEnrollment(
        schoolId,
        createDto.schoolMembershipId,
        academicSessionId,
      );

    if (existingEnrollment) {
      throw new ConflictException({
        message:
          'This student already has an active enrolment in this academic session. Use the transfer operation to change the class.',
        success: false,
        status: 409,
      });
    }

    const enrollment =
      await this.studentEnrollmentsRepository.createStudentEnrollment({
        schoolId: new Types.ObjectId(schoolId),
        studentId: membership.userId,
        schoolMembershipId: membership._id,
        classId: new Types.ObjectId(createDto.classId),
        academicSessionId: new Types.ObjectId(academicSessionId),
        status: StudentEnrollmentStatus.ACTIVE,
        enrolledAt: new Date(),
        endedAt: null,
      });

    return enrollment;
  }

  async findAllStudentEnrollments(
    schoolId: string,
    academicSessionId: string,
    queryDto: QueryWithPaginationDto,
  ) {
    this.validateObjectId(schoolId, 'school ID');
    this.validateObjectId(academicSessionId, 'academic session ID');

    await this.findSessionOrThrow(schoolId, academicSessionId);

    const result =
      await this.studentEnrollmentsRepository.findAllStudentEnrollments(
        schoolId,
        academicSessionId,
        queryDto,
      );

    if (
      !result.studentEnrolmentObj ||
      result.studentEnrolmentObj.length === 0
    ) {
      throw new NotFoundException({
        message: 'Student enrollments not found.',
        success: false,
        status: 404,
      });
    }

    return result;
  }

  async findStudentEnrollmentById(
    schoolId: string,
    academicSessionId: string,
    enrollmentId: string,
  ) {
    this.validateObjectId(schoolId, 'school ID');
    this.validateObjectId(academicSessionId, 'academic session ID');
    this.validateObjectId(enrollmentId, 'enrolment ID');

    await this.findSessionOrThrow(schoolId, academicSessionId);

    const enrollment = await this.findEnrollmentOrThrow(
      schoolId,
      academicSessionId,
      enrollmentId,
    );

    return enrollment;
  }

  async transferStudentEnrollment(
    schoolId: string,
    academicSessionId: string,
    enrollmentId: string,
    updateDto: UpdateStudentEnrollmentDto,
  ) {
    this.validateObjectId(schoolId, 'school ID');
    this.validateObjectId(academicSessionId, 'academic session ID');
    this.validateObjectId(enrollmentId, 'enrolment ID');
    this.validateObjectId(updateDto.classId, 'class ID');

    const session = await this.findSessionOrThrow(schoolId, academicSessionId);

    if (session.status === AcademicSessionStatus.COMPLETED) {
      throw new BadRequestException({
        message:
          'Students cannot be transferred within a completed academic session.',
        success: false,
        status: 400,
      });
    }

    const existingEnrollment = await this.findEnrollmentOrThrow(
      schoolId,
      academicSessionId,
      enrollmentId,
    );

    if (existingEnrollment.status !== StudentEnrollmentStatus.ACTIVE) {
      throw new BadRequestException({
        message: 'Only active student enrolments can be transferred.',
        success: false,
        status: 400,
      });
    }

    if (existingEnrollment.classId.toString() === updateDto.classId) {
      throw new BadRequestException({
        message: 'The student is already enrolled in this class.',
        success: false,
        status: 400,
      });
    }

    await this.findClassOrThrow(schoolId, updateDto.classId);

    const newEnrollment =
      await this.studentEnrollmentsRepository.transferStudentEnrollment(
        schoolId,
        academicSessionId,
        enrollmentId,
        {
          schoolId: new Types.ObjectId(schoolId),
          studentId: existingEnrollment.studentId,
          schoolMembershipId: existingEnrollment.schoolMembershipId,
          classId: new Types.ObjectId(updateDto.classId),
          academicSessionId: new Types.ObjectId(academicSessionId),
          status: StudentEnrollmentStatus.ACTIVE,
          enrolledAt: new Date(),
          endedAt: null,
        },
      );

    return newEnrollment;
  }

  async updateStudentEnrollmentStatus(
    schoolId: string,
    academicSessionId: string,
    enrollmentId: string,
    updateDto: UpdateStudentEnrollmentStatusDto,
  ) {
    this.validateObjectId(schoolId, 'school ID');
    this.validateObjectId(academicSessionId, 'academic session ID');
    this.validateObjectId(enrollmentId, 'enrolment ID');

    if (
      ![
        StudentEnrollmentStatus.COMPLETED,
        StudentEnrollmentStatus.WITHDRAWN,
      ].includes(updateDto.status)
    ) {
      throw new BadRequestException({
        message:
          'You can only complete or withdraw an active enrolment using this operation.',
        success: false,
        status: 400,
      });
    }

    await this.findEnrollmentOrThrow(schoolId, academicSessionId, enrollmentId);

    const enrollment =
      await this.studentEnrollmentsRepository.updateStudentEnrollmentStatus(
        schoolId,
        academicSessionId,
        enrollmentId,
        updateDto.status,
      );

    if (!enrollment) {
      throw new ConflictException({
        message:
          'This enrolment is no longer active. Please refresh and try again.',
        success: false,
        status: 409,
      });
    }

    return enrollment;
  }

  async countStudentEnrollments(
    schoolId: string,
    academicSessionId?: string,
    classId?: string,
    status?: StudentEnrollmentStatus,
  ) {
    this.validateObjectId(schoolId, 'school ID');

    if (academicSessionId) {
      this.validateObjectId(academicSessionId, 'academic session ID');
      await this.findSessionOrThrow(schoolId, academicSessionId);
    }

    if (classId) {
      this.validateObjectId(classId, 'class ID');
      await this.findClassOrThrow(schoolId, classId);
    }

    const total =
      await this.studentEnrollmentsRepository.countStudentEnrollments(
        schoolId,
        academicSessionId,
        classId,
        status,
      );

    return {
      success: true,
      data: { total },
    };
  }

  private validateObjectId(id: string, fieldName: string): void {
    if (!isValidObjectId(id)) {
      throw new BadRequestException({
        message: `Invalid ${fieldName}.`,
        success: false,
        status: 400,
      });
    }
  }

  private async findSessionOrThrow(
    schoolId: string,
    academicSessionId: string,
  ) {
    const session = await this.academicSessionsService.getAcademicSessionById(
      schoolId,
      academicSessionId,
    );

    if (!session) {
      throw new NotFoundException({
        message: 'Academic session not found.',
        success: false,
        status: 404,
      });
    }

    return session;
  }

  private async findMembershipOrThrow(
    schoolId: string,
    schoolMembershipId: string,
  ) {
    const membership = await this.schoolMembershipModel
      .findOne({
        _id: new Types.ObjectId(schoolMembershipId),
        schoolId: new Types.ObjectId(schoolId),
        role: SchoolRole.STUDENT,
        isActive: true,
      })
      .exec();

    if (!membership) {
      throw new NotFoundException({
        message: 'Active student membership not found in this school.',
        success: false,
        stauts: 404,
      });
    }

    return membership;
  }

  private async findClassOrThrow(schoolId: string, classId: string) {
    const schoolClass = await this.classesService.getSchoolClassById(
      schoolId,
      classId,
    );

    if (!schoolClass.isActive) {
      throw new BadRequestException({
        message: 'Students cannot be enrolled into an inactive class.',
        success: false,
        status: 400,
      });
    }

    return schoolClass;
  }

  private async findEnrollmentOrThrow(
    schoolId: string,
    academicSessionId: string,
    enrollmentId: string,
  ) {
    const enrollment =
      await this.studentEnrollmentsRepository.findStudentEnrollmentById(
        schoolId,
        academicSessionId,
        enrollmentId,
      );

    if (!enrollment) {
      throw new NotFoundException({
        message: 'Student enrolment not found.',
        success: false,
        status: 404,
      });
    }

    return enrollment;
  }
}
