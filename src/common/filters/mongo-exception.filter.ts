import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { MongoServerError } from 'mongodb';
import mongoose from 'mongoose';

@Catch(
  MongoServerError,
  mongoose.Error.CastError,
  mongoose.Error.ValidationError,
)
export class MongoExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Handle NestJS HTTP exceptions first
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const responseBody = exception.getResponse();

      return response.status(status).json(responseBody);
    }

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Database error';

    // Duplicate key error (unique: true)
    if (exception instanceof MongoServerError && exception.code === 11000) {
      status = HttpStatus.CONFLICT;

      const field = Object.keys(exception.keyValue)[0];
      const value = exception.keyValue[field];

      message = `${field} "${value}" already exists.`;
    }

    // Invalid ObjectId
    else if (exception instanceof mongoose.Error.CastError) {
      status = HttpStatus.BAD_REQUEST;
      message = `Invalid ID format`;
    }

    // Validation error
    else if (exception instanceof mongoose.Error.ValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = Object.values(exception.errors)
        .map((err: any) => err.message)
        .join(', ');
    }

    console.log('exception instance:', exception);
    response.status(status).json({
      success: false,
      status,
      message,
    });
  }
}
