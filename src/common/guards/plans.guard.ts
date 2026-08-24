import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PlanCode } from '../../modules/plans/schemas/plan.schema';

@Injectable()
export class PlansGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    console.log('I want to run PlansGuard');
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException({
        message: 'Authentication required',
        success: false,
        status: 401,
      });
    }

    const plan = (
      request.params?.plan ||
      request.body?.plan ||
      request.query?.plan
    )
      ?.toString()
      .toUpperCase();

    if (!plan) {
      throw new ForbiddenException({
        message: 'Plan parameter is required.',
        success: false,
        status: 403,
      });
    }

    const userPlans: PlanCode[] = user.plans || [];

    const hasPlan = userPlans.some((p) => p.toUpperCase() === plan);

    if (!hasPlan) {
      throw new ForbiddenException({
        message: `You do not have active access to the ${plan} plan`,
        success: false,
        status: 403,
      });
    }

    return true;
  }
}
