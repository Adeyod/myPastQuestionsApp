import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentSchoolMembership = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();

    console.log('request.schoolMembership:', request.schoolMembership);

    return request.schoolMembership;
  },
);
