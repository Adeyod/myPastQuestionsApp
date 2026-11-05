import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { QueryWithPaginationDto } from '../../../common/dto/query-with-pagination';
import { School, SchoolDocument } from '../schemas/schools.schema';

@Injectable()
export class SchoolRepository {
  constructor(
    @InjectModel(School.name)
    private readonly schoolModel: Model<SchoolDocument>,
  ) {}

  async getAllSchools(queryDto: QueryWithPaginationDto): Promise<{
    schoolObj: SchoolDocument[];
    totalPages: number;
    totalCount: number;
  }> {
    const { page, searchParams, limit } = queryDto;

    let query = this.schoolModel.find();

    if (searchParams) {
      const regex = new RegExp(searchParams, 'i');

      query = query.where({
        $or: [
          { schoolName: { $regex: regex } },
          { subDomain: { $regex: regex } },
          { schoolEmail: { $regex: regex } },
          { state: { $regex: regex } },
          { town: { $regex: regex } },
          { address: { $regex: regex } },
          { accessMode: { $regex: regex } },
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
          message: 'Page can not be found.',
          status: 404,
          success: false,
        });
      }
    }

    const schools = await query.sort({ createdAt: -1 });

    if (schools.length === 0) {
      throw new NotFoundException({
        message: 'Schools not found.',
        success: false,
        status: 404,
      });
    }

    const response = {
      schoolObj: schools,
      totalPages: pages,
      totalCount: count,
    };

    return response;
  }

  async createSchoolWithSession(
    payload: Partial<School>,
    session?: ClientSession,
  ): Promise<SchoolDocument> {
    const school = new this.schoolModel(payload);

    const response = await school.save({ session });

    return response;
  }

  async findSchoolById(schoolId: string): Promise<SchoolDocument | null> {
    const id = new Types.ObjectId(schoolId);

    const response = await this.schoolModel
      .findById(id)
      .populate('schoolOwner', 'firstName lastName email phoneNumber')
      .exec();

    return response;
  }

  async findSchoolBySubDomain(
    subDomain: string,
  ): Promise<SchoolDocument | null> {
    const response = await this.schoolModel
      .findOne({ subDomain: subDomain.trim().toLowerCase() })
      .exec();

    return response;
  }

  async findSchoolByEmail(schoolEmail: string): Promise<SchoolDocument | null> {
    const response = await this.schoolModel
      .findOne({ schoolEmail: schoolEmail.trim().toLowerCase() })
      .exec();

    return response;
  }

  async findAllSchools(queryDto: QueryWithPaginationDto): Promise<{
    schoolObj: SchoolDocument[];
    totalPages: number;
    totalCount: number;
  }> {
    const { page, limit, searchParams } = queryDto;

    let query = this.schoolModel.find();

    if (searchParams) {
      const regex = new RegExp(searchParams, 'i');
      query = query.where({
        $or: [{ schoolName: { $regex: regex } }],
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

    const schools = await query.sort({ createdAt: -1 });

    if (schools.length === 0) {
      throw new NotFoundException({
        message: 'Schools not found.',
        success: false,
        status: 404,
      });
    }

    const response = {
      schoolObj: schools,
      totalPages: pages,
      totalCount: count,
    };

    return response;
  }

  async updateSchool(
    schoolId: string,
    payload: Partial<School>,
  ): Promise<SchoolDocument | null> {
    const id = new Types.ObjectId(schoolId);

    const response = await this.schoolModel
      .findByIdAndUpdate(
        id,
        { $set: payload },
        { returnDocument: 'after', runValidators: true },
      )
      .populate('schoolOwner', 'firstName lastName email phoneNumber')
      .exec();

    return response;
  }

  async updateSchoolStatus(
    schoolId: string,
    isActive: boolean,
  ): Promise<SchoolDocument | null> {
    const id = new Types.ObjectId(schoolId);

    const response = await this.schoolModel
      .findByIdAndUpdate(
        id,
        { $set: { isActive } },
        { new: true, runValidators: true },
      )
      .exec();

    return response;
  }

  async schoolExistsBySubDomain(
    subDomain: string,
    excludeSchoolId?: string,
  ): Promise<boolean> {
    const query = {
      subDomain: subDomain.toLowerCase(),
      ...(excludeSchoolId && {
        _id: { $ne: new Types.ObjectId(excludeSchoolId) },
      }),
    };

    const response = Boolean(await this.schoolModel.exists(query));
    return response;
  }

  async schoolExistsByEmail(
    schoolEmail: string,
    excludeSchoolId?: string,
  ): Promise<boolean> {
    const query = {
      schoolEmail: schoolEmail.toLowerCase(),
      ...(excludeSchoolId && {
        _id: { $ne: new Types.ObjectId(excludeSchoolId) },
      }),
    };

    const response = Boolean(await this.schoolModel.exists(query));
    return response;
  }
}
