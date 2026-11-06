import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { School, SchoolDocument } from '../schools/schemas/schools.schema';

import {
  SchoolMembership,
  SchoolMembershipDocument,
} from '../school-memberships/schemas/school-membership.schema';

@Injectable()
export class SchoolLoginService {
  constructor(
    @InjectModel(School.name)
    private readonly schoolModel: Model<SchoolDocument>,

    @InjectModel(SchoolMembership.name)
    private readonly schoolMembershipModel: Model<SchoolMembershipDocument>,
  ) {}

  async verifySchoolMembership(userId: string, subdomain: string) {
    const normalizedSubdomain = subdomain.trim().toLowerCase();

    const school = await this.schoolModel.findOne({
      subDomain: normalizedSubdomain,
      isActive: true,
    });

    if (!school) {
      throw new UnauthorizedException({
        message: 'Unable to sign in to this school.',
        success: false,
        status: 401,
      });
    }

    const membership = await this.schoolMembershipModel.findOne({
      schoolId: school._id,
      userId: new Types.ObjectId(userId),
      isActive: true,
    });

    if (!membership) {
      throw new UnauthorizedException({
        message: 'You do not have an active membership in this school.',
        success: false,
        status: 401,
      });
    }

    return {
      schoolName: school.schoolName,
      subDomain: school.subDomain,
      userSchoolMembership: membership,
    };
  }
}
