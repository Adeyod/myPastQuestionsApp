import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MongoServerError } from 'mongodb';
import { isValidObjectId, Types } from 'mongoose';

import { CreateStudentEnrollmentDto } from './dtos/create-student-enrollment.dto';
import { UpdateStudentEnrollmentStatusDto } from './dtos/update-student-enrollment-status.dto';
import { UpdateStudentEnrollmentDto } from './dtos/update-student-enrollment.dto';

import { QueryWithPaginationDto } from '../../common/dto/query-with-pagination';
import { AcademicSessionsService } from '../academic-sessions/academic-sessions.service';
import { AcademicSessionStatus } from '../academic-sessions/schemas/academic-session.schema';
import { ClassesService } from '../classes/classes.service';
import { SchoolRole } from '../school-memberships/schemas/school-membership.schema';

import { ClassStudentEnrollmentStatus } from './schemas/student-enrollment.schema';

import { SchoolMembershipsService } from '../school-memberships/school-memberships.service';
import { StudentEnrollmentsRepository } from './repositories/student-enrollments.repository';

@Injectable()
export class StudentEnrollmentsService {
  constructor(
    private readonly studentEnrollmentsRepository: StudentEnrollmentsRepository,
    private readonly classesService: ClassesService,
    private readonly academicSessionsService: AcademicSessionsService,
    private readonly schoolMembershipService: SchoolMembershipsService,
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

    this.validateSubjectsOffered(createDto.subjectsOffered);

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

    const schoolClass = await this.findClassOrThrow(
      schoolId,
      createDto.classId,
    );

    if (!schoolClass?.subjects?.length) {
      throw new BadRequestException({
        message: 'Subjects not found for this class.',
        success: false,
        status: 400,
      });
    }

    this.validateStudentSubjects(
      createDto.subjectsOffered,
      schoolClass.subjects,
    );

    const existingActiveEnrollment =
      await this.studentEnrollmentsRepository.findActiveStudentEnrollment(
        schoolId,
        createDto.schoolMembershipId,
        session._id.toString(),
      );

    if (existingActiveEnrollment) {
      throw new ConflictException({
        message:
          'This student already has an active enrolment in this academic session. Use the transfer operation to change the class.',
        success: false,
        status: 409,
      });
    }

    const studentPayload = {
      studentId: membership.userId,
      schoolMembershipId: membership._id,
      subjectsOffered: createDto.subjectsOffered.map(
        (subjectId) => new Types.ObjectId(subjectId),
      ),
      status: ClassStudentEnrollmentStatus.ACTIVE,
      enrolledAt: new Date(),
      endedAt: null,
    };

    const existingClassEnrollment =
      await this.studentEnrollmentsRepository.findClassEnrollmentByClassAndSession(
        new Types.ObjectId(schoolId),
        schoolClass._id,
        session._id,
      );

    if (existingClassEnrollment) {
      const updatedEnrollment =
        await this.studentEnrollmentsRepository.addStudentToClassEnrollment(
          schoolId,
          createDto.classId,
          academicSessionId,
          studentPayload,
        );

      if (!updatedEnrollment) {
        throw new ConflictException({
          message:
            'This student already has an enrollment record in this class and academic session.',
          success: false,
          status: 409,
        });
      }

      return updatedEnrollment;
    }

    try {
      const response =
        await this.studentEnrollmentsRepository.createClassEnrollment({
          schoolId: schoolClass.schoolId,
          classId: schoolClass._id,
          academicSessionId: session._id,
          students: [studentPayload],
        });

      return response;
    } catch (error) {
      if (error instanceof MongoServerError && error.code === 11000) {
        const updatedEnrollment =
          await this.studentEnrollmentsRepository.addStudentToClassEnrollment(
            schoolId,
            createDto.classId,
            academicSessionId,
            studentPayload,
          );

        if (updatedEnrollment) {
          return updatedEnrollment;
        }

        throw new ConflictException({
          message:
            'This student already has an enrollment record in this class and academic session.',
          success: false,
          status: 409,
        });
      }

      throw error;
    }
  }

  async findAllEnrollmentsOfASchoolInASession(
    schoolId: string,
    academicSessionId: string,
    queryDto: QueryWithPaginationDto,
  ) {
    this.validateObjectId(schoolId, 'school ID');
    this.validateObjectId(academicSessionId, 'academic session ID');

    await this.findSessionOrThrow(schoolId, academicSessionId);

    const result =
      await this.studentEnrollmentsRepository.findAllClassEnrollmentsOfASchoolInASession(
        schoolId,
        academicSessionId,
        queryDto,
      );

    return result;
  }

  async findActiveStudentEnrollment(
    schoolId: string,
    academicSessionId: string,
    schoolMembershipId: string,
  ) {
    this.validateObjectId(schoolId, 'school ID');
    this.validateObjectId(academicSessionId, 'academic session ID');
    this.validateObjectId(schoolMembershipId, 'membership ID');

    await this.findSessionOrThrow(schoolId, academicSessionId);

    return await this.studentEnrollmentsRepository.findActiveStudentEnrollment(
      schoolId,
      schoolMembershipId,
      academicSessionId,
    );
  }
  async findClassEnrollmentById(
    schoolId: string,
    academicSessionId: string,
    enrollmentId: string,
  ) {
    this.validateObjectId(schoolId, 'school ID');
    this.validateObjectId(academicSessionId, 'academic session ID');
    this.validateObjectId(enrollmentId, 'class enrollment ID');

    await this.findSessionOrThrow(schoolId, academicSessionId);

    return await this.findEnrollmentOrThrow(
      schoolId,
      academicSessionId,
      enrollmentId,
    );
  }

  async transferStudentEnrollment(
    schoolId: string,
    academicSessionId: string,
    enrollmentId: string,
    schoolMembershipId: string,
    updateDto: UpdateStudentEnrollmentDto,
  ) {
    this.validateObjectId(schoolId, 'school ID');
    this.validateObjectId(academicSessionId, 'academic session ID');
    this.validateObjectId(enrollmentId, 'class enrollment ID');
    this.validateObjectId(schoolMembershipId, 'school membership ID');
    this.validateObjectId(updateDto.classId, 'destination class ID');

    const academicSession = await this.findSessionOrThrow(
      schoolId,
      academicSessionId,
    );

    if (academicSession.status === AcademicSessionStatus.COMPLETED) {
      throw new BadRequestException({
        message:
          'Students cannot be transferred within a completed academic session.',
        success: false,
        status: 400,
      });
    }

    const currentEnrollment = await this.findEnrollmentOrThrow(
      schoolId,
      academicSessionId,
      enrollmentId,
    );

    const enrolledStudent = currentEnrollment.students.find(
      (student) => student.schoolMembershipId.toString() === schoolMembershipId,
    );

    if (!enrolledStudent) {
      throw new NotFoundException({
        message: 'The student was not found in this class enrollment.',
        success: false,
        status: 404,
      });
    }

    if (enrolledStudent.status !== ClassStudentEnrollmentStatus.ACTIVE) {
      throw new BadRequestException({
        message: 'Only active student enrolments can be transferred.',
        success: false,
        status: 400,
      });
    }

    if (currentEnrollment.classId.toString() === updateDto.classId) {
      throw new BadRequestException({
        message: 'The student is already enrolled in this class.',
        success: false,
        status: 400,
      });
    }

    const destinationClass = await this.findClassOrThrow(
      schoolId,
      updateDto.classId,
    );

    const existingSubjects = enrolledStudent.subjectsOffered.map((subjectId) =>
      subjectId.toString(),
    );

    this.validateStudentSubjects(existingSubjects, destinationClass.subjects);

    const newEnrollment =
      await this.studentEnrollmentsRepository.transferStudentEnrollment(
        schoolId,
        academicSessionId,
        enrollmentId,
        schoolMembershipId,
        updateDto.classId,
        {
          studentId: enrolledStudent.studentId,
          schoolMembershipId: enrolledStudent.schoolMembershipId,
          subjectsOffered: enrolledStudent.subjectsOffered,
          status: ClassStudentEnrollmentStatus.ACTIVE,
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
    schoolMembershipId: string,
    updateDto: UpdateStudentEnrollmentStatusDto,
  ) {
    this.validateObjectId(schoolId, 'school ID');
    this.validateObjectId(academicSessionId, 'academic session ID');
    this.validateObjectId(enrollmentId, 'class enrollment ID');
    this.validateObjectId(schoolMembershipId, 'school membership ID');

    if (
      ![
        ClassStudentEnrollmentStatus.COMPLETED,
        ClassStudentEnrollmentStatus.WITHDRAWN,
      ].includes(updateDto.status)
    ) {
      throw new BadRequestException({
        message:
          'You can only complete or withdraw an active student enrolment using this operation.',
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
        schoolMembershipId,
        updateDto.status,
      );

    if (!enrollment) {
      throw new ConflictException({
        message:
          'This student enrolment is no longer active. Please refresh and try again.',
        success: false,
        status: 409,
      });
    }

    return enrollment;
  }

  async countStudentEnrollments(schoolId: string, academicSessionId: string) {
    this.validateObjectId(schoolId, 'school ID');

    this.validateObjectId(academicSessionId, 'academic session ID');
    await this.findSessionOrThrow(schoolId, academicSessionId);

    const total =
      await this.studentEnrollmentsRepository.countStudentEnrollments(
        schoolId,
        academicSessionId,
      );

    return {
      success: true,
      data: { total },
    };
  }
  async countStudentEnrollmentsInAClass(
    schoolId: string,
    academicSessionId: string,
    classId: string,
  ) {
    this.validateObjectId(schoolId, 'school ID');

    this.validateObjectId(academicSessionId, 'academic session ID');
    await this.findSessionOrThrow(schoolId, academicSessionId);

    this.validateObjectId(classId, 'class ID');
    await this.findClassOrThrow(schoolId, classId);

    const total =
      await this.studentEnrollmentsRepository.countStudentEnrollmentsInAClass(
        schoolId,
        academicSessionId,
        classId,
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

  private validateSubjectsOffered(subjectsOffered?: string[]): void {
    if (!Array.isArray(subjectsOffered) || subjectsOffered.length === 0) {
      throw new BadRequestException({
        message: 'Please select at least one subject for the student.',
        success: false,
        status: 400,
      });
    }

    for (const subjectId of subjectsOffered) {
      this.validateObjectId(subjectId, 'subject ID');
    }

    const uniqueSubjects = new Set(subjectsOffered);

    if (uniqueSubjects.size !== subjectsOffered.length) {
      throw new BadRequestException({
        message: 'Duplicate subjects are not allowed.',
        success: false,
        status: 400,
      });
    }
  }

  private validateStudentSubjects(
    selectedSubjectIds: string[],
    classSubjects: any[],
  ): void {
    const classSubjectIds = new Set(
      classSubjects.map((subject) => {
        const id = subject?._id || subject;
        return id.toString();
      }),
    );

    const invalidSubjects = selectedSubjectIds.filter(
      (subjectId) => !classSubjectIds.has(subjectId),
    );

    if (invalidSubjects.length > 0) {
      throw new BadRequestException({
        message: 'One or more selected subjects are not offered by this class.',
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
    const membership =
      await this.schoolMembershipService.findActiveSchoolMemberShipByUserIdSchoolIdAndRole(
        new Types.ObjectId(schoolId),
        new Types.ObjectId(schoolMembershipId),
        SchoolRole.STUDENT,
      );

    if (!membership) {
      throw new NotFoundException({
        message: 'Active student membership not found in this school.',
        success: false,
        status: 404,
      });
    }

    return membership;
  }

  private async findClassOrThrow(schoolId: string, classId: string) {
    const schoolClass = await this.classesService.getSchoolClassById(
      schoolId,
      classId,
    );

    if (!schoolClass) {
      throw new NotFoundException({
        message: 'Class not found.',
        success: false,
        status: 404,
      });
    }

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
      await this.studentEnrollmentsRepository.findClassEnrollmentById(
        schoolId,
        academicSessionId,
        enrollmentId,
      );

    if (!enrollment) {
      throw new NotFoundException({
        message: 'Class enrollment not found.',
        success: false,
        status: 404,
      });
    }

    return enrollment;
  }
}
