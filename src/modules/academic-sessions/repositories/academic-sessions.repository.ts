import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { QueryWithPaginationDto } from '../../../common/dto/query-with-pagination';
import {
  AcademicSession,
  AcademicSessionDocument,
} from '../schemas/academic-session.schema';

@Injectable()
export class AcademicSessionsRepository {
  constructor(
    @InjectModel(AcademicSession.name)
    private readonly academicSessionModel: Model<AcademicSessionDocument>,
  ) {}

  async createAcademicSession(
    payload: Partial<AcademicSession>,
  ): Promise<AcademicSessionDocument> {
    const response = new this.academicSessionModel(payload);

    const result = await response.save();

    return result;
  }

  async findAllAcademicSessions(
    schoolId: string,
    queryDto: QueryWithPaginationDto,
  ): Promise<{
    sessionObj: AcademicSessionDocument[];
    totalPages: number;
    totalCount: number;
  }> {
    const { page, searchParams, limit } = queryDto;

    let query = this.academicSessionModel.find({
      schoolId: new Types.ObjectId(schoolId),
    });

    if (searchParams) {
      const regex = new RegExp(searchParams, 'i');

      query = query.where({
        $or: [
          { sessionName: { $regex: regex } },
          { sectionName: { $regex: regex } },
          { periodType: { $regex: regex } },
          { status: { $regex: regex } },
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

    const sessions = await query.sort({ createdAt: -1 });

    if (sessions.length === 0) {
      throw new NotFoundException({
        message: 'Academic sessions not found.',
        success: false,
        status: 404,
      });
    }

    const response = {
      sessionObj: sessions,
      totalPages: pages,
      totalCount: count,
    };

    return response;
  }

  async findAcademicSessionById(
    schoolId: string,
    sessionId: string,
  ): Promise<AcademicSessionDocument | null> {
    const response = await this.academicSessionModel
      .findOne({
        _id: new Types.ObjectId(sessionId),
        schoolId: new Types.ObjectId(schoolId),
      })
      .exec();

    return response;
  }

  async findAcademicSessionByName(
    schoolId: string,
    sessionName: string,
    sectionName: string | null,
    excludeSessionId?: string,
  ): Promise<AcademicSessionDocument | null> {
    const filter: Record<string, any> = {
      schoolId: new Types.ObjectId(schoolId),
      sessionName,
      sectionName,
    };

    if (excludeSessionId) {
      filter._id = {
        $ne: new Types.ObjectId(excludeSessionId),
      };
    }

    const response = await this.academicSessionModel.findOne(filter).exec();

    return response;
  }

  async updateAcademicSession(
    schoolId: string,
    sessionId: string,
    payload: Partial<AcademicSession>,
  ): Promise<AcademicSessionDocument | null> {
    const response = await this.academicSessionModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(sessionId),
          schoolId: new Types.ObjectId(schoolId),
        },
        { $set: payload },
        { returnDocument: 'after', runValidators: true },
      )
      .exec();

    return response;
  }

  async updateAcademicSessionStatus(
    schoolId: string,
    sessionId: string,
    status: string,
  ): Promise<AcademicSessionDocument | null> {
    const response = await this.academicSessionModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(sessionId),
          schoolId: new Types.ObjectId(schoolId),
        },
        { $set: { status } },
        { returnDocument: 'after', runValidators: true },
      )
      .exec();

    return response;
  }

  async deleteAcademicSession(
    schoolId: string,
    sessionId: string,
  ): Promise<AcademicSessionDocument | null> {
    return this.academicSessionModel
      .findOneAndDelete({
        _id: new Types.ObjectId(sessionId),
        schoolId: new Types.ObjectId(schoolId),
      })
      .exec();
  }

  async countAcademicSessions(schoolId: string): Promise<number> {
    const response = await this.academicSessionModel.countDocuments({
      schoolId: new Types.ObjectId(schoolId),
    });

    return response;
  }
}
