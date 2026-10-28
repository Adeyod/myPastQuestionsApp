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

    if (exception instanceof HttpException) {
      const status = exception.getStatus();

      return response.status(status).json(exception.getResponse());
    }

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'A database error occurred. Please try again later.';

    if (exception instanceof MongoServerError && exception.code === 11000) {
      status = HttpStatus.CONFLICT;

      const keyPattern = exception.keyPattern ?? {};
      const keyValue = exception.keyValue ?? {};
      const errorMessage = exception.message ?? '';

      if (
        errorMessage.includes('unique_successful_subscription_per_user_plan') ||
        (keyPattern.userId === 1 &&
          keyPattern.plan === 1 &&
          Object.keys(keyPattern).length === 2)
      ) {
        message = 'You have already subscribed to this plan.';
      } else if (
        keyPattern.reference === 1 ||
        Object.prototype.hasOwnProperty.call(keyValue, 'reference')
      ) {
        message = 'This payment reference already exists. Please try again.';
      } else if (
        keyPattern.providerReference === 1 ||
        Object.prototype.hasOwnProperty.call(keyValue, 'providerReference')
      ) {
        message =
          'This provider transaction reference has already been processed.';
      } else {
        const fields = Object.keys(keyPattern);

        if (fields.length > 0) {
          message = `A record with the same ${fields.join(
            ' and ',
          )} already exists.`;
        } else {
          message = 'This record conflicts with an existing database record.';
        }
      }
    } else if (exception instanceof mongoose.Error.CastError) {
      status = HttpStatus.BAD_REQUEST;

      message =
        exception.kind === 'ObjectId'
          ? `Invalid ${exception.path} format.`
          : `Invalid value for "${exception.path}".`;
    } else if (exception instanceof mongoose.Error.ValidationError) {
      status = HttpStatus.BAD_REQUEST;

      message = Object.values(exception.errors)
        .map((err: any) => err.message)
        .join(', ');
    }

    return response.status(status).json({
      success: false,
      status,
      message,
    });
  }
}
