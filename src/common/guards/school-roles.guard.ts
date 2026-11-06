import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SchoolRole } from '../../modules/school-memberships/schemas/school-membership.schema';
import { SCHOOL_ROLES_KEY } from '../decorators/school-roles.decorator';

@Injectable()
export class SchoolRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<SchoolRole[]>(
      SCHOOL_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      // throw new ForbiddenException({
      //   message: 'Invalid role or role not provided.',
      //   success: false,
      //   status: 403,
      // });
      return true;
    }

    const request = context.switchToHttp().getRequest();

    const membership = request.schoolMembership;

    if (!membership) {
      throw new ForbiddenException({
        message: 'School membership has not been verified.',
        success: false,
        status: 403,
      });
    }

    if (!requiredRoles.includes(membership.role)) {
      throw new ForbiddenException({
        message: 'You do not have permission to perform this operation.',
        success: false,
        status: 403,
      });
    }

    return true;
  }
}
