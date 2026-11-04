import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClientSession, Types } from 'mongoose';

import { QueryWithPaginationDto } from '../../common/dto/query-with-pagination';
import { CreateSchoolMembershipDto } from './dtos/create-school-membership.dto';
import { SchoolMembershipRepository } from './repositories/school-membership.repository';
import { SchoolRole } from './schemas/school-membership.schema';

@Injectable()
export class SchoolMembershipsService {
  constructor(
    private readonly schoolMembershipRepository: SchoolMembershipRepository,
  ) {}

  async createSchoolMemberWithSession(
    payload: CreateSchoolMembershipDto,
    session: ClientSession,
  ) {
    const { schoolId, userId, role } = payload;

    if (!Types.ObjectId.isValid(schoolId) || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid school ID or user ID');
    }

    const membershipExists =
      await this.schoolMembershipRepository.userExistsInSchoolWithSession(
        schoolId,
        userId,
        session,
      );

    if (membershipExists) {
      throw new ConflictException({
        message: 'This user already has a membership in this school',
        success: false,
        status: 409,
      });
    }

    const response =
      await this.schoolMembershipRepository.createSchoolMemberWithSession(
        {
          schoolId: new Types.ObjectId(schoolId),
          userId: new Types.ObjectId(userId),
          role,
          isActive: true,
          joinedAt: new Date(),
        },
        session,
      );

    return response;
  }
  async createSchoolMember(payload: CreateSchoolMembershipDto) {
    const { schoolId, userId, role } = payload;

    if (!Types.ObjectId.isValid(schoolId) || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid school ID or user ID');
    }

    const membershipExists =
      await this.schoolMembershipRepository.userExistsInSchool(
        schoolId,
        userId,
      );

    if (membershipExists) {
      throw new ConflictException({
        message: 'This user already has a membership in this school',
        success: false,
        status: 409,
      });
    }

    const response = await this.schoolMembershipRepository.createSchoolMember({
      schoolId: new Types.ObjectId(schoolId),
      userId: new Types.ObjectId(userId),
      role,
      isActive: true,
      joinedAt: new Date(),
    });

    return response;
  }

  async findSchoolMemberById(membershipId: string) {
    if (!Types.ObjectId.isValid(membershipId)) {
      throw new BadRequestException({
        message: 'Invalid membership ID',
        success: false,
        status: 400,
      });
    }

    const membership =
      await this.schoolMembershipRepository.findSchoolMemberById(membershipId);

    if (!membership) {
      throw new NotFoundException({
        message: 'School membership not found',
        success: false,
        status: 404,
      });
    }

    return membership;
  }

  async findBySchool(
    schoolId: string,
    query: QueryWithPaginationDto,
    role?: SchoolRole,
  ) {
    const { page, limit, searchParams } = query;

    if (!Types.ObjectId.isValid(schoolId)) {
      throw new BadRequestException({
        message: 'Invalid school ID',
        success: false,
        status: 400,
      });
    }

    const result =
      await this.schoolMembershipRepository.findSchoolMembersBySchool(
        schoolId,
        query,
      );

    return result;
  }

  async findByUser(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException({
        message: 'Invalid user ID',
        success: false,
        status: 400,
      });
    }

    const response = await this.schoolMembershipRepository.findByUser(userId);
    return response;
  }

  async updateSchoolMembershipRole(membershipId: string, role: SchoolRole) {
    if (!Types.ObjectId.isValid(membershipId)) {
      throw new BadRequestException({
        message: 'Invalid membership ID',
        success: false,
        status: 400,
      });
    }

    const membership =
      await this.schoolMembershipRepository.updateSchoolMembershipRole(
        membershipId,
        role,
      );

    if (!membership) {
      throw new NotFoundException({
        message: 'School membership not found',
        success: false,
        status: 404,
      });
    }

    return membership;
  }

  async updateSchoolMembershipStatus(membershipId: string, isActive: boolean) {
    if (!Types.ObjectId.isValid(membershipId)) {
      throw new BadRequestException({
        message: 'Invalid membership ID',
        success: false,
        status: 400,
      });
    }

    const membership =
      await this.schoolMembershipRepository.updateSchoolMembershipStatus(
        membershipId,
        isActive,
      );

    if (!membership) {
      throw new NotFoundException({
        message: 'School membership not found',
        success: false,
        status: 404,
      });
    }

    return membership;
  }
}
