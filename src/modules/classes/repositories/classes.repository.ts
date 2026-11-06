import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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

  async findAllSchoolClasses(schoolId: string): Promise<SchoolClassDocument[]> {
    const response = await this.schoolClassModel
      .find({
        schoolId: new Types.ObjectId(schoolId),
      })
      .sort({ className: 1 })
      .exec();
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
      })
      .exec();

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
