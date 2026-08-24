import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { map, Observable } from 'rxjs';
import { SUCCESS_MESSAGE_KEY } from '../decorators/success-message.decorator';

@Injectable()
export class GlobalResponseInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> {
    const message =
      this.reflector.get<string>(SUCCESS_MESSAGE_KEY, context.getHandler()) ||
      'Request Successful';
    return next.handle().pipe(
      map((data) => {
        const response: any = {
          success: true,
          message,
        };

        if (data !== undefined && data !== null) {
          response.data = data;
        }

        return response;
      }),
    );
  }
}
