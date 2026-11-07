import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { QueryWithPaginationDto } from '../../../common/dto/query-with-pagination';
import { CreateSchoolSubjectDto } from '../dtos/create-subject.dto';
import { UpdateSchoolSubjectDto } from '../dtos/update-subject.dto';
import {
  SchoolSubject,
  SchoolSubjectDocument,
} from '../schemas/school-subject.schema';

@Injectable()
export class SchoolSubjectsRepository {
  constructor(
    @InjectModel(SchoolSubject.name)
    private readonly schoolSubjectModel: Model<SchoolSubjectDocument>,
  ) {}

  async findSubjectBySubjectCode(
    schoolId: Types.ObjectId,
    subjectCode: string,
  ): Promise<SchoolSubjectDocument | null> {
    const response = await this.schoolSubjectModel.findOne({
      schoolId: schoolId,
      subjectCode: subjectCode.trim().toUpperCase(),
    });

    return response;
  }
  async findSubjectBySubjectName(
    schoolId: Types.ObjectId,
    subjectName: string,
  ): Promise<SchoolSubjectDocument | null> {
    const response = await this.schoolSubjectModel.findOne({
      schoolId: schoolId,
      subjectName: subjectName.trim().toUpperCase(),
    });

    return response;
  }

  async createSubject(
    schoolId: string,
    payload: CreateSchoolSubjectDto,
  ): Promise<SchoolSubjectDocument> {
    const subject = new this.schoolSubjectModel({
      ...payload,
      schoolId: new Types.ObjectId(schoolId),
    });

    const response = await subject.save();

    return response;
  }

  async findAllSchoolSubjects(
    schoolId: string,
    queryWithPaginationDto: QueryWithPaginationDto,
  ): Promise<{
    subjectsObj: SchoolSubjectDocument[] | null;
    totalPages: number;
    totalCount: number;
  }> {
    console.log('SchoolId:', schoolId);
    const { page, limit, searchParams } = queryWithPaginationDto;

    let query = this.schoolSubjectModel.find({
      schoolId: new Types.ObjectId(schoolId),
    });

    if (searchParams) {
      const regex = new RegExp(searchParams, 'i');

      query = query.where({
        $or: [
          { subjectName: { $regex: regex } },
          { subjectCode: { $regex: regex } },
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

    const subjects = await query.sort({ createdAt: -1 });

    if (subjects.length === 0) {
      throw new NotFoundException({
        message: 'Subjects not found.',
        success: false,
        status: 404,
      });
    }

    const response = {
      subjectsObj: subjects,
      totalCount: count,
      totalPages: pages,
    };

    return response;
  }

  async findSubjectById(
    schoolId: string,
    subjectId: string,
  ): Promise<SchoolSubjectDocument | null> {
    const response = await this.schoolSubjectModel
      .findOne({
        _id: new Types.ObjectId(subjectId),
        schoolId: new Types.ObjectId(schoolId),
      })
      .exec();

    return response;
  }

  async updateSubject(
    schoolId: string,
    subjectId: string,
    payload: UpdateSchoolSubjectDto,
  ): Promise<SchoolSubjectDocument | null> {
    const response = await this.schoolSubjectModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(subjectId),
          schoolId: new Types.ObjectId(schoolId),
        },
        {
          $set: payload,
        },
        {
          returnDocuments: 'after',
          runValidators: true,
        },
      )
      .exec();

    return response;
  }

  async updateSubjectStatus(
    schoolId: string,
    subjectId: string,
    isActive: boolean,
  ): Promise<SchoolSubjectDocument | null> {
    const response = await this.schoolSubjectModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(subjectId),
          schoolId: new Types.ObjectId(schoolId),
        },
        {
          $set: { isActive },
        },
        {
          returnDocuments: 'after',
          runValidators: true,
        },
      )
      .exec();

    return response;
  }

  async countSchoolSubjects(schoolId: string): Promise<number> {
    const response = await this.schoolSubjectModel.countDocuments({
      schoolId: new Types.ObjectId(schoolId),
    });

    return response;
  }
}
