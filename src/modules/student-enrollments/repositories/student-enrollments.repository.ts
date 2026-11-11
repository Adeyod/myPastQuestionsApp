import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { ClientSession, Connection, Model, Types } from 'mongoose';

import { QueryWithPaginationDto } from '../../../common/dto/query-with-pagination';
import {
  ClassEnrollment,
  ClassEnrollmentDocument,
  ClassStudentEnrollmentStatus,
} from '../schemas/student-enrollment.schema';

type EnrolledStudentPayload = {
  studentId: Types.ObjectId;
  schoolMembershipId: Types.ObjectId;
  subjectsOffered: Types.ObjectId[];
  status?: ClassStudentEnrollmentStatus;
  enrolledAt?: Date;
  endedAt?: Date | null;
};

type CreateClassEnrollmentPayload = {
  schoolId: Types.ObjectId;
  classId: Types.ObjectId;
  academicSessionId: Types.ObjectId;
  students: EnrolledStudentPayload[];
};

@Injectable()
export class StudentEnrollmentsRepository {
  constructor(
    @InjectModel(ClassEnrollment.name)
    private readonly classEnrollmentModel: Model<ClassEnrollmentDocument>,

    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  async createClassEnrollment(
    payload: CreateClassEnrollmentPayload,
    session?: ClientSession,
  ): Promise<ClassEnrollmentDocument> {
    const enrollment = await new this.classEnrollmentModel(
      payload,
      session ? { session } : undefined,
    ).save();

    return enrollment;
  }

  async findClassEnrollmentByClassAndSession(
    schoolId: Types.ObjectId,
    classId: Types.ObjectId,
    academicSessionId: Types.ObjectId,
    session?: ClientSession,
  ): Promise<ClassEnrollmentDocument | null> {
    const response = await this.classEnrollmentModel
      .findOne({
        schoolId: new Types.ObjectId(schoolId),
        classId: new Types.ObjectId(classId),
        academicSessionId: new Types.ObjectId(academicSessionId),
      })
      .session(session ?? null)
      .exec();

    return response;
  }

  async addStudentToClassEnrollment(
    schoolId: string,
    classId: string,
    academicSessionId: string,
    student: EnrolledStudentPayload,
    session?: ClientSession,
  ): Promise<ClassEnrollmentDocument | null> {
    const response = await this.classEnrollmentModel
      .findOneAndUpdate(
        {
          schoolId: new Types.ObjectId(schoolId),
          classId: new Types.ObjectId(classId),
          academicSessionId: new Types.ObjectId(academicSessionId),
          'students.schoolMembershipId': {
            $ne: student.schoolMembershipId,
          },
        },
        {
          $push: {
            students: {
              ...student,
              status: student.status ?? ClassStudentEnrollmentStatus.ACTIVE,
              enrolledAt: student.enrolledAt ?? new Date(),
              endedAt: student.endedAt ?? null,
            },
          },
        },
        {
          returnDocument: 'after',
          runValidators: true,
          session,
        },
      )
      .exec();

    return response;
  }

  async findAllClassEnrollmentsOfASchoolInASession(
    schoolId: string,
    academicSessionId: string,
    queryDto: QueryWithPaginationDto,
  ): Promise<{
    classEnrollments: ClassEnrollmentDocument[];
    totalPages: number;
    totalCount: number;
  }> {
    const { page, searchParams, limit } = queryDto;

    const filter: Record<string, any> = {
      schoolId: new Types.ObjectId(schoolId),
      academicSessionId: new Types.ObjectId(academicSessionId),
    };

    if (searchParams) {
      const regex = new RegExp(searchParams, 'i');

      filter['students.status'] = { $regex: regex };
    }

    let query = this.classEnrollmentModel.find(filter).populate({
      path: 'classId',
      select: 'className classCode',
    });

    const totalCount = await this.classEnrollmentModel
      .countDocuments(filter)
      .exec();

    let totalPages = 0;

    if (page !== undefined && limit !== undefined && totalCount > 0) {
      totalPages = Math.ceil(totalCount / limit);

      if (page > totalPages) {
        throw new NotFoundException({
          message: 'Page cannot be found.',
          status: 404,
          success: false,
        });
      }

      query = query.skip((page - 1) * limit).limit(limit);
    }

    const classEnrollments = await query.sort({ createdAt: -1 }).exec();

    return {
      classEnrollments,
      totalPages,
      totalCount,
    };
  }

  async findClassEnrollmentById(
    schoolId: string,
    academicSessionId: string,
    classEnrollmentId: string,
  ): Promise<ClassEnrollmentDocument | null> {
    const response = await this.classEnrollmentModel
      .findOne({
        _id: new Types.ObjectId(classEnrollmentId),
        schoolId: new Types.ObjectId(schoolId),
        academicSessionId: new Types.ObjectId(academicSessionId),
      })
      .populate({
        path: 'classId',
        select: 'className classCode',
      })
      .populate({
        path: 'students.studentId',
        select: 'firstName lastName email',
      })
      .populate({
        path: 'students.subjectsOffered',
        select: 'subjectName subjectCode',
      })
      .exec();

    return response;
  }

  async findActiveStudentEnrollment(
    schoolId: string,
    schoolMembershipId: string,
    academicSessionId: string,
    session?: ClientSession,
  ): Promise<ClassEnrollmentDocument | null> {
    const response = await this.classEnrollmentModel
      .findOne(
        {
          schoolId: new Types.ObjectId(schoolId),
          academicSessionId: new Types.ObjectId(academicSessionId),
          students: {
            $elemMatch: {
              schoolMembershipId: new Types.ObjectId(schoolMembershipId),
              status: ClassStudentEnrollmentStatus.ACTIVE,
            },
          },
        },
        {
          students: {
            $elemMatch: {
              schoolMembershipId: new Types.ObjectId(schoolMembershipId),
              status: ClassStudentEnrollmentStatus.ACTIVE,
            },
          },
        },
      )
      .session(session ?? null)
      .exec();

    return response;
  }

  /**
   * Finds a specific student inside a class-enrollment document.
   */
  async findStudentInClassEnrollment(
    schoolId: string,
    academicSessionId: string,
    classEnrollmentId: string,
    schoolMembershipId: string,
  ): Promise<ClassEnrollmentDocument | null> {
    const response = await this.classEnrollmentModel
      .findOne({
        _id: new Types.ObjectId(classEnrollmentId),
        schoolId: new Types.ObjectId(schoolId),
        academicSessionId: new Types.ObjectId(academicSessionId),
        'students.schoolMembershipId': new Types.ObjectId(schoolMembershipId),
      })
      .exec();

    return response;
  }

  async updateStudentEnrollmentStatus(
    schoolId: string,
    academicSessionId: string,
    classEnrollmentId: string,
    schoolMembershipId: string,
    status: ClassStudentEnrollmentStatus,
  ): Promise<ClassEnrollmentDocument | null> {
    const response = await this.classEnrollmentModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(classEnrollmentId),
          schoolId: new Types.ObjectId(schoolId),
          academicSessionId: new Types.ObjectId(academicSessionId),
          students: {
            $elemMatch: {
              schoolMembershipId: new Types.ObjectId(schoolMembershipId),
              status: ClassStudentEnrollmentStatus.ACTIVE,
            },
          },
        },
        {
          $set: {
            'students.$.status': status,
            'students.$.endedAt': new Date(),
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

  /**
   * Transfers a student from one class to another
   * within the same academic session.
   *
   * The old student entry is retained with TRANSFERRED status.
   * The student is added to the destination class enrollment.
   */
  async transferStudentEnrollment(
    schoolId: string,
    academicSessionId: string,
    currentClassEnrollmentId: string,
    schoolMembershipId: string,
    destinationClassId: string,
    studentPayload: EnrolledStudentPayload,
  ): Promise<ClassEnrollmentDocument> {
    const session = await this.connection.startSession();

    let destinationEnrollment: ClassEnrollmentDocument | null = null;

    try {
      await session.withTransaction(async () => {
        const previousEnrollment =
          await this.classEnrollmentModel.findOneAndUpdate(
            {
              _id: new Types.ObjectId(currentClassEnrollmentId),
              schoolId: new Types.ObjectId(schoolId),
              academicSessionId: new Types.ObjectId(academicSessionId),
              students: {
                $elemMatch: {
                  schoolMembershipId: new Types.ObjectId(schoolMembershipId),
                  status: ClassStudentEnrollmentStatus.ACTIVE,
                },
              },
            },
            {
              $set: {
                'students.$.status': ClassStudentEnrollmentStatus.TRANSFERRED,
                'students.$.endedAt': new Date(),
              },
            },
            {
              returnDocument: 'after',
              runValidators: true,
              session,
            },
          );

        if (!previousEnrollment) {
          throw new ConflictException({
            message:
              'The student does not have an active enrollment in the current class.',
            success: false,
            status: 409,
          });
        }

        const destinationFilter = {
          schoolId: new Types.ObjectId(schoolId),
          classId: new Types.ObjectId(destinationClassId),
          academicSessionId: new Types.ObjectId(academicSessionId),
        };

        const existingDestination = await this.classEnrollmentModel
          .findOne(destinationFilter)
          .session(session)
          .exec();

        if (existingDestination) {
          const studentAlreadyExists = existingDestination.students.some(
            (item) => item.schoolMembershipId.toString() === schoolMembershipId,
          );

          if (studentAlreadyExists) {
            throw new ConflictException({
              message:
                'The student already has an enrollment record in the destination class.',
              success: false,
              status: 409,
            });
          }

          existingDestination.students.push({
            ...studentPayload,
            status: ClassStudentEnrollmentStatus.ACTIVE,
            enrolledAt: new Date(),
            endedAt: null,
          });

          destinationEnrollment = await existingDestination.save({
            session,
          });
        } else {
          const [createdEnrollment] = await this.classEnrollmentModel.create(
            [
              {
                ...destinationFilter,
                students: [
                  {
                    ...studentPayload,
                    status: ClassStudentEnrollmentStatus.ACTIVE,
                    enrolledAt: new Date(),
                    endedAt: null,
                  },
                ],
              },
            ],
            { session },
          );

          destinationEnrollment = createdEnrollment;
        }
      });
    } finally {
      await session.endSession();
    }

    if (!destinationEnrollment) {
      throw new ConflictException({
        message: 'The student transfer could not be completed.',
        success: false,
        status: 409,
      });
    }

    return destinationEnrollment;
  }

  async countStudentEnrollments(
    schoolId: string,
    academicSessionId: string,
  ): Promise<number> {
    const match: Record<string, any> = {
      schoolId: new Types.ObjectId(schoolId),
    };

    match.academicSessionId = new Types.ObjectId(academicSessionId);

    const pipeline: any[] = [{ $match: match }, { $unwind: '$students' }];

    pipeline.push({
      $match: {
        'students.status': ClassStudentEnrollmentStatus.ACTIVE,
      },
    });

    pipeline.push({
      $count: 'total',
    });

    const [result] = await this.classEnrollmentModel.aggregate(pipeline).exec();

    return result?.total ?? 0;
  }
  async countStudentEnrollmentsInAClass(
    schoolId: string,
    academicSessionId: string,
    classId: string,
  ): Promise<number> {
    const match: Record<string, any> = {
      schoolId: new Types.ObjectId(schoolId),
    };

    match.academicSessionId = new Types.ObjectId(academicSessionId);

    match.classId = new Types.ObjectId(classId);

    const pipeline: any[] = [{ $match: match }, { $unwind: '$students' }];

    pipeline.push({
      $match: {
        'students.status': ClassStudentEnrollmentStatus.ACTIVE,
      },
    });

    pipeline.push({
      $count: 'total',
    });

    const [result] = await this.classEnrollmentModel.aggregate(pipeline).exec();

    return result?.total ?? 0;
  }

  /**
   * Counts the number of class-enrollment documents.
   * This is different from counting students.
   */
  async countClassEnrollments(
    schoolId: string,
    academicSessionId?: string,
  ): Promise<number> {
    const filter: Record<string, any> = {
      schoolId: new Types.ObjectId(schoolId),
    };

    if (academicSessionId) {
      filter.academicSessionId = new Types.ObjectId(academicSessionId);
    }

    const response = await this.classEnrollmentModel
      .countDocuments(filter)
      .exec();

    return response;
  }
}
