import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../modules/users/schemas/user.schema';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    console.log('I want to run RolesGuard');
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // console.log('RolesGuard requiredRoles:', requiredRoles);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // console.log('RolesGuard user:', user);

    if (!user || !user.role) {
      throw new ForbiddenException({
        message: 'User not authenticated',
        success: false,
        status: 403,
      });
    }

    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      throw new ForbiddenException({
        message: 'You are not authorized to view this resource.',
        success: false,
        status: 403,
      });
    }

    // console.log('RolesGuard user:', user);
    return true;
    // return requiredRoles.includes(user.role);
  }
}
