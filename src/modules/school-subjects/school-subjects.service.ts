import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { QueryWithPaginationDto } from '../../common/dto/query-with-pagination';
import { CreateSchoolSubjectDto } from './dtos/create-subject.dto';
import { UpdateSchoolSubjectDto } from './dtos/update-subject.dto';
import { SchoolSubjectsRepository } from './repositories/school-subject.repository';

@Injectable()
export class SchoolSubjectsService {
  constructor(private readonly subjectsRepository: SchoolSubjectsRepository) {}

  async createSubject(
    schoolId: string,
    createSubjectDto: CreateSchoolSubjectDto,
  ) {
    try {
      const id = new Types.ObjectId(schoolId);

      const subjectNameExist =
        await this.subjectsRepository.findSubjectBySubjectName(
          id,
          createSubjectDto.subjectName,
        );

      if (subjectNameExist) {
        throw new ConflictException({
          message: 'Subject name already exist for this school.',
          success: false,
          status: 409,
        });
      }

      const subjectCodeExist =
        await this.subjectsRepository.findSubjectBySubjectCode(
          id,
          createSubjectDto.subjectCode,
        );

      if (subjectCodeExist) {
        throw new ConflictException({
          message: 'Subject code already exist for this school.',
          success: false,
          status: 409,
        });
      }
      const subject = await this.subjectsRepository.createSubject(schoolId, {
        ...createSubjectDto,
        subjectName: createSubjectDto.subjectName.trim(),
        subjectCode: createSubjectDto.subjectCode.trim().toUpperCase(),
      });

      return subject;
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException({
          success: false,
          message: 'A subject with this code already exists in this school.',
          error: 'Conflict',
          statusCode: 409,
        });
      }

      throw error;
    }
  }

  async getAllSchoolSubjects(
    schoolId: string,
    queryDto: QueryWithPaginationDto,
  ) {
    const subjects = await this.subjectsRepository.findAllSchoolSubjects(
      schoolId,
      queryDto,
    );

    if (!subjects.subjectsObj || subjects.subjectsObj.length === 0) {
      throw new NotFoundException({
        message: 'Subjects not found.',
        success: false,
        status: 404,
      });
    }

    return subjects;
  }

  async getSchoolSubjectById(schoolId: string, subjectId: string) {
    this.validateObjectId(subjectId, 'subject ID');

    const subject = await this.subjectsRepository.findSubjectById(
      schoolId,
      subjectId,
    );

    if (!subject) {
      throw new NotFoundException({
        success: false,
        message: 'Subject not found.',
        error: 'Not Found',
        statusCode: 404,
      });
    }

    return subject;
  }

  async updateSchoolSubject(
    schoolId: string,
    subjectId: string,
    updateSubjectDto: UpdateSchoolSubjectDto,
  ) {
    this.validateObjectId(subjectId, 'subject ID');

    if (Object.keys(updateSubjectDto).length === 0) {
      throw new BadRequestException({
        success: false,
        message: 'Provide at least one field to update.',
        error: 'Bad Request',
        statusCode: 400,
      });
    }

    const payload: UpdateSchoolSubjectDto = {
      ...updateSubjectDto,
    };

    if (payload.subjectName !== undefined) {
      payload.subjectName = payload.subjectName.trim();
    }

    if (payload.subjectCode !== undefined) {
      payload.subjectCode = payload.subjectCode.trim().toUpperCase();
    }

    try {
      const updatedSubject = await this.subjectsRepository.updateSubject(
        schoolId,
        subjectId,
        payload,
      );

      if (!updatedSubject) {
        throw new NotFoundException({
          success: false,
          message: 'Subject not found.',
          error: 'Not Found',
          statusCode: 404,
        });
      }

      return updatedSubject;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException({
          success: false,
          message: 'A subject with this code already exists in this school.',
          error: 'Conflict',
          statusCode: 409,
        });
      }

      throw error;
    }
  }

  async updateSchoolSubjectStatus(
    schoolId: string,
    subjectId: string,
    isActive: boolean,
  ) {
    this.validateObjectId(subjectId, 'subject ID');

    const updatedSubject = await this.subjectsRepository.updateSubjectStatus(
      schoolId,
      subjectId,
      isActive,
    );

    if (!updatedSubject) {
      throw new NotFoundException({
        success: false,
        message: 'Subject not found.',
        error: 'Not Found',
        statusCode: 404,
      });
    }

    return {
      message: `Subject ${isActive ? 'activated' : 'deactivated'} successfully.`,
      data: updatedSubject,
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
