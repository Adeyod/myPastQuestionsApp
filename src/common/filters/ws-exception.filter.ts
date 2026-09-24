import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Catch()
export class WsExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<Socket>();
    const data = host.switchToWs().getData();

    let status = 500;
    let message = 'Internal server error.';

    if (exception instanceof HttpException) {
      status = exception.getStatus();

      const response = exception.getResponse();

      if (typeof response === 'string') {
        message = response;
      } else if (
        typeof response === 'object' &&
        response !== null &&
        'message' in response
      ) {
        const exceptionMessage = (response as { message?: unknown }).message;

        if (Array.isArray(exceptionMessage)) {
          message = exceptionMessage.join(', ');
        } else if (typeof exceptionMessage === 'string') {
          message = exceptionMessage;
        }
      }
    } else if (exception instanceof WsException) {
      const error = exception.getError();

      if (typeof error === 'string') {
        message = error;
      } else if (
        typeof error === 'object' &&
        error !== null &&
        'message' in error
      ) {
        const exceptionMessage = (error as { message?: unknown }).message;

        if (typeof exceptionMessage === 'string') {
          message = exceptionMessage;
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    console.error('WebSocket exception:', {
      status,
      message,
      pattern: data?.pattern,
      data,
    });

    client.emit('socket_error', {
      status: 'error',
      statusCode: status,
      message,
      pattern: data?.pattern ?? null,
    });
  }
}
