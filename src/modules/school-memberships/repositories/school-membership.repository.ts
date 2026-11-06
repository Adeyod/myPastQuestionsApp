import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { ClientSession } from 'mongoose';
import { QueryWithPaginationDto } from '../../../common/dto/query-with-pagination';
import {
  SchoolMembership,
  SchoolMembershipDocument,
  SchoolRole,
} from '../schemas/school-membership.schema';

@Injectable()
export class SchoolMembershipRepository {
  constructor(
    @InjectModel(SchoolMembership.name)
    private readonly schoolMembershipModel: Model<SchoolMembershipDocument>,
  ) {}

  async createSchoolMemberWithSession(
    payload: Partial<SchoolMembership>,
    session: ClientSession,
  ): Promise<SchoolMembershipDocument> {
    const membership = new this.schoolMembershipModel(payload);

    const response = await membership.save({ session });

    return response;
  }
  async createSchoolMember(
    payload: Partial<SchoolMembership>,
  ): Promise<SchoolMembershipDocument> {
    const membership = new this.schoolMembershipModel(payload);

    const response = await membership.save();

    return response;
  }

  async findSchoolMembershipByUserIdAndSchoolId(
    membershipId: Types.ObjectId,
    schoolId: Types.ObjectId,
  ): Promise<SchoolMembershipDocument | null> {
    const response = await this.schoolMembershipModel
      .findOne({
        userId: membershipId,
        schoolId: schoolId,
      })
      .populate('schoolId')
      .populate('userId')
      .exec();

    return response;
  }

  async findSchoolMemberBySchoolAndUser(
    schoolId: string,
    userId: string,
  ): Promise<SchoolMembershipDocument | null> {
    const response = await this.schoolMembershipModel
      .findOne({
        schoolId: new Types.ObjectId(schoolId),
        userId: new Types.ObjectId(userId),
      })
      .exec();

    return response;
  }

  async findSchoolMembersBySchool(
    schoolId: string,
    queryDto: QueryWithPaginationDto,
  ): Promise<{
    schoolMembershipObj: SchoolMembershipDocument[];
    totalPages: number;
    totalCount: number;
  }> {
    const id = new Types.ObjectId(schoolId);

    const { page, limit, searchParams } = queryDto;

    let query = this.schoolMembershipModel.find({ schoolId: id });

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

      query = query.skip(offset);
      pages = Math.ceil(count / limit);

      if (page > pages) {
        throw new NotFoundException({
          message: 'Page not found.',
          success: false,
          status: 404,
        });
      }
    }

    const schoolMemberships = await query
      .sort({ createdAt: -1 })
      .populate('userId');

    if (schoolMemberships.length === 0) {
      throw new NotFoundException({
        message: 'Memberships not found.',
        success: false,
        status: 404,
      });
    }

    const response = {
      schoolMembershipObj: schoolMemberships,
      totalPages: pages,
      totalCount: count,
    };

    return response;
  }

  async findByUser(userId: string): Promise<SchoolMembershipDocument[]> {
    const response = await this.schoolMembershipModel
      .find({
        userId: new Types.ObjectId(userId),
      })
      .populate('schoolId')
      .sort({ createdAt: -1 })
      .exec();

    return response;
  }

  async updateSchoolMembershipRole(
    membershipId: string,
    role: SchoolRole,
  ): Promise<SchoolMembershipDocument | null> {
    const id = new Types.ObjectId(membershipId);

    const response = await this.schoolMembershipModel
      .findByIdAndUpdate(
        id,
        { $set: { role } },
        { returnDocument: 'after', runValidators: true },
      )
      .exec();

    return response;
  }

  async updateSchoolMembershipStatus(
    membershipId: string,
    isActive: boolean,
  ): Promise<SchoolMembershipDocument | null> {
    const response = await this.schoolMembershipModel
      .findByIdAndUpdate(
        new Types.ObjectId(membershipId),
        { $set: { isActive } },
        { returnDocuments: 'after', runValidators: true },
      )
      .exec();

    return response;
  }

  async userExistsInSchoolWithSession(
    schoolId: string,
    userId: string,
    session: ClientSession,
  ): Promise<boolean> {
    const membership = await this.schoolMembershipModel
      .exists({
        schoolId: new Types.ObjectId(schoolId),
        userId: new Types.ObjectId(userId),
      })
      .session(session);

    return Boolean(membership);
  }
  async userExistsInSchool(schoolId: string, userId: string): Promise<boolean> {
    const membership = await this.schoolMembershipModel.exists({
      schoolId: new Types.ObjectId(schoolId),
      userId: new Types.ObjectId(userId),
    });

    return Boolean(membership);
  }
}
