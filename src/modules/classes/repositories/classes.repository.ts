import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { QueryWithPaginationDto } from '../../../common/dto/query-with-pagination';
import { CreateClassDto } from '../dtos/create-class.dto';
import { UpdateClassDto } from '../dtos/update-class.dto';
import {
  SchoolClass,
  SchoolClassDocument,
} from '../schemas/school-class.schema';

@Injectable()
export class ClassesRepository {
  constructor(
    @InjectModel(SchoolClass.name)
    private readonly schoolClassModel: Model<SchoolClassDocument>,
  ) {}

  async createClass(
    schoolId: string,
    payload: CreateClassDto,
  ): Promise<SchoolClassDocument> {
    const response = await new this.schoolClassModel({
      ...payload,
      schoolId: new Types.ObjectId(schoolId),
    }).save();

    return response;
  }

  async findAllSchoolClasses(
    schoolId: string,
    queryWithPaginationsDto: QueryWithPaginationDto,
  ): Promise<{
    classesObj: SchoolClassDocument[] | null;
    totalPages: number;
    totalCount: number;
  }> {
    const { page, limit, searchParams } = queryWithPaginationsDto;

    let query = this.schoolClassModel.find({
      schoolId: new Types.ObjectId(schoolId),
    });

    if (searchParams) {
      const regex = new RegExp(searchParams, 'i');

      query = query.where({
        $or: [
          { className: { $regex: regex } },
          { classCode: { $regex: regex } },
          { description: { $regex: regex } },
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

    const classes = await query.sort({ createdAt: -1 });

    if (classes.length === 0) {
      throw new NotFoundException({
        message: 'Classes not found.',
        success: false,
        status: 404,
      });
    }

    const response = {
      classesObj: classes,
      totalCount: count,
      totalPages: pages,
    };

    return response;
  }

  async findClassById(
    schoolId: string,
    classId: string,
  ): Promise<SchoolClassDocument | null> {
    const response = await this.schoolClassModel
      .findOne({
        _id: new Types.ObjectId(classId),
        schoolId: new Types.ObjectId(schoolId),
        isActive: true,
      })
      .populate(
        'subjects teacherSubjectAssignments.subject teacherSubjectAssignments.teacher',
      )
      .exec();

    return response;
  }
  async findActiveClassById(
    schoolId: string,
    classId: string,
    session: ClientSession,
  ): Promise<SchoolClassDocument | null> {
    const response = await this.schoolClassModel
      .findOne({
        _id: new Types.ObjectId(classId),
        schoolId: new Types.ObjectId(schoolId),
        isActive: true,
      })
      .session(session)
      .populate(
        'teacherSubjectAssignments.subject teacherSubjectAssignments.teacher',
      )
      .exec();

    return response;
  }

  async findClassByClassCode(
    schoolId: Types.ObjectId,
    classCode: string,
  ): Promise<SchoolClassDocument | null> {
    const response = await this.schoolClassModel.findOne({
      schoolId: schoolId,
      classCode: classCode.trim().toUpperCase(),
    });

    return response;
  }
  async findClassByClassName(
    schoolId: Types.ObjectId,
    className: string,
  ): Promise<SchoolClassDocument | null> {
    const response = await this.schoolClassModel.findOne({
      schoolId: schoolId,
      className: className.trim().toUpperCase(),
    });

    return response;
  }

  async updateClass(
    schoolId: string,
    classId: string,
    payload: UpdateClassDto,
  ): Promise<SchoolClassDocument | null> {
    const response = await this.schoolClassModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(classId),
          schoolId: new Types.ObjectId(schoolId),
        },
        {
          $set: payload,
        },
        {
          returnDocument: 'after',
          runValidators: true,
        },
      )
      .exec();

    return response;
  }

  async updateClassStatus(
    schoolId: string,
    classId: string,
    isActive: boolean,
  ): Promise<SchoolClassDocument | null> {
    const response = await this.schoolClassModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(classId),
          schoolId: new Types.ObjectId(schoolId),
        },
        {
          $set: { isActive },
        },
        {
          returnDocument: 'after',
        },
      )
      .exec();

    return response;
  }

  async countSchoolClasses(schoolId: string): Promise<number> {
    const response = await this.schoolClassModel.countDocuments({
      schoolId: new Types.ObjectId(schoolId),
    });

    return response;
  }
}
