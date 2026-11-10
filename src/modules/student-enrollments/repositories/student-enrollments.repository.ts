import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { ClientSession, Connection, Model, Types } from 'mongoose';

import { QueryWithPaginationDto } from '../../../common/dto/query-with-pagination';
import {
  StudentEnrollment,
  StudentEnrollmentDocument,
  StudentEnrollmentStatus,
} from '../schemas/student-enrollment.schema';

@Injectable()
export class StudentEnrollmentsRepository {
  constructor(
    @InjectModel(StudentEnrollment.name)
    private readonly studentEnrollmentModel: Model<StudentEnrollmentDocument>,

    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  async createStudentEnrollment(
    payload: Partial<StudentEnrollment>,
  ): Promise<StudentEnrollmentDocument> {
    const enrollment = await new this.studentEnrollmentModel(payload).save();

    return enrollment;
  }

  async findAllStudentEnrollments(
    schoolId: string,
    academicSessionId: string,
    queryDto: QueryWithPaginationDto,
  ): Promise<{
    studentEnrolmentObj: StudentEnrollmentDocument[];
    totalPages: number;
    totalCount: number;
  }> {
    const { page, searchParams, limit } = queryDto;

    let query = this.studentEnrollmentModel.find({
      schoolId: new Types.ObjectId(schoolId),
      academicSessionId: new Types.ObjectId(academicSessionId),
    });

    if (searchParams) {
      const regex = new RegExp(searchParams, 'i');

      query = query.where({
        $or: [{ periodName: { $regex: regex } }, { status: { $regex: regex } }],
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
          message: 'Page can not be found.',
          status: 404,
          success: false,
        });
      }
    }

    const studentEnrollments = await query.sort({ createdAt: -1 });

    if (studentEnrollments.length === 0) {
      throw new NotFoundException({
        message: 'Student enrollments not found.',
        success: false,
        status: 404,
      });
    }

    const response = {
      studentEnrolmentObj: studentEnrollments,
      totalPages: pages,
      totalCount: count,
    };

    return response;
  }

  async findStudentEnrollmentById(
    schoolId: string,
    academicSessionId: string,
    enrollmentId: string,
  ): Promise<StudentEnrollmentDocument | null> {
    const response = await this.studentEnrollmentModel
      .findOne({
        _id: new Types.ObjectId(enrollmentId),
        schoolId: new Types.ObjectId(schoolId),
        academicSessionId: new Types.ObjectId(academicSessionId),
      })
      .populate({
        path: 'classId',
        select: 'className classCode',
      })
      .exec();

    return response;
  }

  async findActiveEnrollment(
    schoolId: string,
    schoolMembershipId: string,
    academicSessionId: string,
  ): Promise<StudentEnrollmentDocument | null> {
    const response = await this.studentEnrollmentModel
      .findOne({
        schoolId: new Types.ObjectId(schoolId),
        schoolMembershipId: new Types.ObjectId(schoolMembershipId),
        academicSessionId: new Types.ObjectId(academicSessionId),
        status: StudentEnrollmentStatus.ACTIVE,
      })
      .exec();

    return response;
  }

  async updateStudentEnrollmentStatus(
    schoolId: string,
    academicSessionId: string,
    enrollmentId: string,
    status: StudentEnrollmentStatus,
  ): Promise<StudentEnrollmentDocument | null> {
    const response = await this.studentEnrollmentModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(enrollmentId),
          schoolId: new Types.ObjectId(schoolId),
          academicSessionId: new Types.ObjectId(academicSessionId),
          status: StudentEnrollmentStatus.ACTIVE,
        },
        {
          $set: {
            status,
            endedAt: new Date(),
          },
        },
        {
          returnDocument: 'after',
          runValidators: true,
        },
      )
      .exec();

    return response;
  }

  async transferStudentEnrollment(
    schoolId: string,
    academicSessionId: string,
    currentEnrollmentId: string,
    newEnrollmentPayload: Partial<StudentEnrollment>,
  ): Promise<StudentEnrollmentDocument> {
    const session: ClientSession = await this.connection.startSession();

    let newEnrollment: StudentEnrollmentDocument | null = null;

    try {
      await session.withTransaction(async () => {
        const previousEnrollment =
          await this.studentEnrollmentModel.findOneAndUpdate(
            {
              _id: new Types.ObjectId(currentEnrollmentId),
              schoolId: new Types.ObjectId(schoolId),
              academicSessionId: new Types.ObjectId(academicSessionId),
              status: StudentEnrollmentStatus.ACTIVE,
            },
            {
              $set: {
                status: StudentEnrollmentStatus.TRANSFERRED,
                endedAt: new Date(),
              },
            },
            {
              returnDocument: 'after',
              session,
            },
          );

        if (!previousEnrollment) {
          throw new ConflictException({
            message:
              'This enrolment is no longer active. Please refresh and try again.',
            success: false,
            status: 409,
          });
        }

        const createdEnrollments = await this.studentEnrollmentModel.create(
          [newEnrollmentPayload],
          { session },
        );

        newEnrollment = createdEnrollments[0];
      });
    } finally {
      await session.endSession();
    }

    if (!newEnrollment) {
      throw new ConflictException({
        message: 'The student transfer could not be completed.',
        success: false,
        status: 409,
      });
    }

    return newEnrollment;
  }

  async countStudentEnrollments(
    schoolId: string,
    academicSessionId?: string,
    classId?: string,
    status?: StudentEnrollmentStatus,
  ): Promise<number> {
    const filter: Record<string, any> = {
      schoolId: new Types.ObjectId(schoolId),
    };

    if (academicSessionId) {
      filter.academicSessionId = new Types.ObjectId(academicSessionId);
    }

    if (classId) {
      filter.classId = new Types.ObjectId(classId);
    }

    if (status) {
      filter.status = status;
    }

    const response = await this.studentEnrollmentModel
      .countDocuments(filter)
      .exec();

    return response;
  }
}
