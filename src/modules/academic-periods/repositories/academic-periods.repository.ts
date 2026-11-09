import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { QueryWithPaginationDto } from '../../../common/dto/query-with-pagination';
import {
  AcademicPeriod,
  AcademicPeriodDocument,
  AcademicPeriodStatus,
} from '../schemas/academic-period.schema';

@Injectable()
export class AcademicPeriodsRepository {
  constructor(
    @InjectModel(AcademicPeriod.name)
    private readonly academicPeriodModel: Model<AcademicPeriodDocument>,
  ) {}

  async createAcademicPeriod(
    payload: Partial<AcademicPeriod>,
  ): Promise<AcademicPeriodDocument> {
    const academicPeriod = new this.academicPeriodModel(payload);
    const response = await academicPeriod.save();

    return response;
  }

  async findAllAcademicPeriods(
    schoolId: string,
    academicSessionId: string,
    queryDto: QueryWithPaginationDto,
  ): Promise<{
    academicPeriodObj: AcademicPeriodDocument[];
    totalPages: number;
    totalCount: number;
  }> {
    const { page, searchParams, limit } = queryDto;

    let query = this.academicPeriodModel.find({
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

    const academicPeriods = await query.sort({ createdAt: -1 });

    if (academicPeriods.length === 0) {
      throw new NotFoundException({
        message: 'Academic periods not found.',
        success: false,
        status: 404,
      });
    }

    const response = {
      academicPeriodObj: academicPeriods,
      totalPages: pages,
      totalCount: count,
    };

    return response;
  }

  async findAcademicPeriodById(
    schoolId: string,
    academicSessionId: string,
    periodId: string,
  ): Promise<AcademicPeriodDocument | null> {
    const response = await this.academicPeriodModel
      .findOne({
        _id: new Types.ObjectId(periodId),
        schoolId: new Types.ObjectId(schoolId),
        academicSessionId: new Types.ObjectId(academicSessionId),
      })
      .exec();

    return response;
  }

  async findAcademicPeriodByName(
    schoolId: string,
    academicSessionId: string,
    periodName: string,
    excludePeriodId?: string,
  ): Promise<AcademicPeriodDocument | null> {
    const filter: Record<string, any> = {
      schoolId: new Types.ObjectId(schoolId),
      academicSessionId: new Types.ObjectId(academicSessionId),
      periodName: periodName.trim(),
    };

    if (excludePeriodId) {
      filter._id = {
        $ne: new Types.ObjectId(excludePeriodId),
      };
    }

    const response = await this.academicPeriodModel.findOne(filter).exec();

    return response;
  }

  async findAcademicPeriodByNumber(
    schoolId: string,
    academicSessionId: string,
    periodNumber: number,
    excludePeriodId?: string,
  ): Promise<AcademicPeriodDocument | null> {
    const filter: Record<string, any> = {
      schoolId: new Types.ObjectId(schoolId),
      academicSessionId: new Types.ObjectId(academicSessionId),
      periodNumber,
    };

    if (excludePeriodId) {
      filter._id = {
        $ne: new Types.ObjectId(excludePeriodId),
      };
    }

    const response = await this.academicPeriodModel.findOne(filter).exec();

    return response;
  }

  async findOverlappingAcademicPeriod(
    schoolId: string,
    academicSessionId: string,
    startDate: Date,
    endDate: Date,
    excludePeriodId?: string,
  ): Promise<AcademicPeriodDocument | null> {
    const filter: Record<string, any> = {
      schoolId: new Types.ObjectId(schoolId),
      academicSessionId: new Types.ObjectId(academicSessionId),
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
    };

    if (excludePeriodId) {
      filter._id = {
        $ne: new Types.ObjectId(excludePeriodId),
      };
    }

    const response = await this.academicPeriodModel.findOne(filter).exec();

    return response;
  }

  async updateAcademicPeriod(
    schoolId: string,
    academicSessionId: string,
    periodId: string,
    payload: Partial<AcademicPeriod>,
  ): Promise<AcademicPeriodDocument | null> {
    const response = await this.academicPeriodModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(periodId),
          schoolId: new Types.ObjectId(schoolId),
          academicSessionId: new Types.ObjectId(academicSessionId),
        },
        { $set: payload },
        {
          returnDocument: 'after',
          runValidators: true,
        },
      )
      .exec();

    return response;
  }

  async updateAcademicPeriodStatus(
    schoolId: string,
    academicSessionId: string,
    periodId: string,
    status: AcademicPeriodStatus,
  ): Promise<AcademicPeriodDocument | null> {
    const response = await this.academicPeriodModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(periodId),
          schoolId: new Types.ObjectId(schoolId),
          academicSessionId: new Types.ObjectId(academicSessionId),
        },
        { $set: { status } },
        {
          returnDocument: 'after',
          runValidators: true,
        },
      )
      .exec();
    return response;
  }

  async deleteAcademicPeriod(
    schoolId: string,
    academicSessionId: string,
    periodId: string,
  ): Promise<AcademicPeriodDocument | null> {
    const response = await this.academicPeriodModel
      .findOneAndDelete({
        _id: new Types.ObjectId(periodId),
        schoolId: new Types.ObjectId(schoolId),
        academicSessionId: new Types.ObjectId(academicSessionId),
      })
      .exec();

    return response;
  }

  async countAcademicPeriods(
    schoolId: string,
    academicSessionId?: string,
  ): Promise<number> {
    const filter: Record<string, any> = {
      schoolId: new Types.ObjectId(schoolId),
    };

    if (academicSessionId) {
      filter.academicSessionId = new Types.ObjectId(academicSessionId);
    }

    const response = await this.academicPeriodModel
      .countDocuments(filter)
      .exec();

    return response;
  }
}
