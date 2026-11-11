import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClientSession, Types } from 'mongoose';

import { QueryWithPaginationDto } from '../../common/dto/query-with-pagination';
import { SchoolSubjectsService } from '../school-subjects/school-subjects.service';
import { CreateClassDto } from './dtos/create-class.dto';
import { UpdateClassDto } from './dtos/update-class.dto';
import { ClassesRepository } from './repositories/classes.repository';

@Injectable()
export class ClassesService {
  constructor(
    private readonly classesRepository: ClassesRepository,
    private readonly subjectsService: SchoolSubjectsService,
  ) {}

  async createClass(schoolId: string, createClassDto: CreateClassDto) {
    try {
      const id = new Types.ObjectId(schoolId);

      const classNameExist = await this.classesRepository.findClassByClassName(
        id,
        createClassDto.className,
      );

      if (classNameExist) {
        throw new ConflictException({
          message: 'Class name already exist for this school.',
          success: false,
          status: 409,
        });
      }

      const classCodeExist = await this.classesRepository.findClassByClassCode(
        id,
        createClassDto.classCode,
      );

      if (classCodeExist) {
        throw new ConflictException({
          message: 'Class code already exist for this school.',
          success: false,
          status: 409,
        });
      }

      const findSubjects = await this.subjectsService.getSchoolSubjectsByIds(
        schoolId,
        createClassDto.subjects,
      );

      const schoolClass = await this.classesRepository.createClass(schoolId, {
        ...createClassDto,
        className: createClassDto.className.trim().toUpperCase(),
        classCode: createClassDto.classCode.trim().toUpperCase(),
      });

      return schoolClass;
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException({
          success: false,
          message: 'A class with this code already exists in this school.',
          error: 'Conflict',
          err: error,
          statusCode: 409,
        });
      }

      throw error;
    }
  }

  async getAllSchoolClasses(
    schoolId: string,
    queryDto: QueryWithPaginationDto,
  ) {
    const classes = await this.classesRepository.findAllSchoolClasses(
      schoolId,
      queryDto,
    );

    if (!classes.classesObj || classes.classesObj.length === 0) {
      throw new NotFoundException({
        message: 'Classes not found.',
        success: false,
        status: 404,
      });
    }

    return classes;
  }

  async getSchoolActiveClassById(
    schoolId: string,
    classId: string,
    session: ClientSession,
  ) {
    this.validateObjectId(classId, 'class ID');

    const schoolClass = await this.classesRepository.findActiveClassById(
      schoolId,
      classId,
      session,
    );

    if (!schoolClass) {
      throw new NotFoundException({
        success: false,
        message: 'Class not found.',
        error: 'Not Found',
        statusCode: 404,
      });
    }

    return schoolClass;
  }
  async getSchoolClassById(schoolId: string, classId: string) {
    this.validateObjectId(classId, 'class ID');

    const schoolClass = await this.classesRepository.findClassById(
      schoolId,
      classId,
    );

    if (!schoolClass) {
      throw new NotFoundException({
        success: false,
        message: 'Class not found.',
        error: 'Not Found',
        statusCode: 404,
      });
    }

    return schoolClass;
  }

  async updateSchoolClass(
    schoolId: string,
    classId: string,
    updateClassDto: UpdateClassDto,
  ) {
    this.validateObjectId(classId, 'class ID');

    if (Object.keys(updateClassDto).length === 0) {
      throw new BadRequestException({
        success: false,
        message: 'Provide at least one field to update.',
        error: 'Bad Request',
        statusCode: 400,
      });
    }

    const payload: UpdateClassDto = {
      ...updateClassDto,
    };

    if (payload.className !== undefined) {
      payload.className = payload.className.trim();
    }

    if (payload.classCode !== undefined) {
      payload.classCode = payload.classCode.trim().toUpperCase();
    }

    try {
      const updatedClass = await this.classesRepository.updateClass(
        schoolId,
        classId,
        payload,
      );

      if (!updatedClass) {
        throw new NotFoundException({
          success: false,
          message: 'Class not found.',
          error: 'Not Found',
          statusCode: 404,
        });
      }

      return updatedClass;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException({
          success: false,
          message: 'A class with this code already exists in this school.',
          error: 'Conflict',
          statusCode: 409,
        });
      }

      throw error;
    }
  }

  async updateSchoolClassStatus(
    schoolId: string,
    classId: string,
    isActive: boolean,
  ) {
    this.validateObjectId(classId, 'class ID');

    const updatedClass = await this.classesRepository.updateClassStatus(
      schoolId,
      classId,
      isActive,
    );

    if (!updatedClass) {
      throw new NotFoundException({
        success: false,
        message: 'Class not found.',
        error: 'Not Found',
        statusCode: 404,
      });
    }

    return {
      message: `Class ${isActive ? 'activated' : 'deactivated'} successfully.`,
      data: updatedClass,
    };
  }

  private validateObjectId(id: string, fieldName: string): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException({
        success: false,
        message: `Invalid ${fieldName}.`,
        error: 'Bad Request',
        statusCode: 400,
      });
    }
  }

  private isDuplicateKeyError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: number }).code === 11000
    );
  }
}
