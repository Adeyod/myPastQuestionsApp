import { SetMetadata } from '@nestjs/common';
import { SchoolRole } from '../../modules/school-memberships/schemas/school-membership.schema';

export const SCHOOL_ROLES_KEY = 'school_roles';

export const SchoolRoles = (...roles: SchoolRole[]) =>
  SetMetadata(SCHOOL_ROLES_KEY, roles);
