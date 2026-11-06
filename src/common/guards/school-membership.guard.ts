import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  School,
  SchoolDocument,
} from '../../modules/schools/schemas/schools.schema';

import {
  SchoolMembership,
  SchoolMembershipDocument,
} from '../../modules/school-memberships/schemas/school-membership.schema';

interface SchoolRequest {
  user?: {
    sub: string | Types.ObjectId;
    email: string;
    role: string;
    plans: string[];
  };
  headers: {
    'x-school-subdomain'?: string | string[];
  };
  params: {
    schoolId?: string;
  };
  school?: SchoolDocument;
  schoolMembership?: SchoolMembershipDocument;
}

@Injectable()
export class SchoolMembershipGuard implements CanActivate {
  constructor(
    @InjectModel(School.name)
    private readonly schoolModel: Model<SchoolDocument>,

    @InjectModel(SchoolMembership.name)
    private readonly schoolMembershipModel: Model<SchoolMembershipDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<SchoolRequest>();

    const userId = request.user?.sub;

    if (!userId) {
      throw new UnauthorizedException({
        message: 'Authentication required.',
        success: false,
        status: 401,
      });
    }

    if (!Types.ObjectId.isValid(userId.toString())) {
      throw new UnauthorizedException({
        message: 'Invalid authenticated user.',
        success: false,
        status: 401,
      });
    }

    const subdomainHeader = request.headers['x-school-subdomain'];

    const subdomain = Array.isArray(subdomainHeader)
      ? subdomainHeader[0]
      : subdomainHeader;

    if (!subdomain || !subdomain.trim()) {
      throw new ForbiddenException({
        message: 'School subdomain is required.',
        success: false,
        status: 403,
      });
    }

    const normalizedSubdomain = subdomain.trim().toLowerCase();

    const school = await this.schoolModel
      .findOne({
        subDomain: normalizedSubdomain,
      })
      .exec();

    if (!school) {
      throw new NotFoundException({
        message: 'School not found.',
        success: false,
        stauts: 404,
      });
    }

    if (!school.isActive) {
      throw new ForbiddenException({
        message: 'This school is currently inactive.',
        success: false,
        status: 403,
      });
    }

    const routeSchoolId = request.params?.schoolId;

    if (routeSchoolId) {
      if (
        !Types.ObjectId.isValid(routeSchoolId) ||
        !school._id.equals(new Types.ObjectId(routeSchoolId))
      ) {
        throw new ForbiddenException({
          message:
            'The requested school does not match the supplied school subdomain.',
          success: false,
          status: 403,
        });
      }
    }

    const membership = await this.schoolMembershipModel
      .findOne({
        schoolId: school._id,
        userId: new Types.ObjectId(userId.toString()),
        isActive: true,
      })
      .exec();

    if (!membership) {
      throw new ForbiddenException({
        message: 'You do not have an active membership in this school.',
        success: false,
        status: 403,
      });
    }

    request.school = school;
    request.schoolMembership = membership;

    return true;
  }
}
