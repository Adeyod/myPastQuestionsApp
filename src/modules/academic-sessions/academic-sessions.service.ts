import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';

import { QueryWithPaginationDto } from '../../common/dto/query-with-pagination';
import { CreateAcademicSessionDto } from './dtos/create-academic-session.dto';
import { UpdateAcademicSessionStatusDto } from './dtos/update-academic-session-status.dto';
import { UpdateAcademicSessionDto } from './dtos/update-academic-session.dto';
import { AcademicSessionsRepository } from './repositories/academic-sessions.repository';
import {
  AcademicSession,
  AcademicSessionStatus,
} from './schemas/academic-session.schema';

@Injectable()
export class AcademicSessionsService {
  constructor(
    private readonly academicSessionsRepository: AcademicSessionsRepository,
  ) {}

  async createAcademicSession(
    schoolId: string,
    createDto: CreateAcademicSessionDto,
  ) {
    this.validateObjectId(schoolId, 'school ID');

    const startDate = new Date(createDto.startDate);
    const endDate = new Date(createDto.endDate);

    this.validateDates(startDate, endDate);

    const sessionName = createDto.sessionName.trim();

    const sectionName = createDto.sectionName?.trim() || null;

    const existingSession =
      await this.academicSessionsRepository.findAcademicSessionByName(
        schoolId,
        sessionName,
        sectionName,
      );

    if (existingSession) {
      throw new ConflictException({
        success: false,
        status: 409,
        message:
          'An academic session with this name already exists for this section.',
      });
    }

    try {
      const academicSession =
        await this.academicSessionsRepository.createAcademicSession({
          schoolId: new Types.ObjectId(schoolId),
          sessionName,
          sectionName,
          periodType: createDto.periodType,
          startDate,
          endDate,
          status: AcademicSessionStatus.UPCOMING,
        });

      return academicSession;
    } catch (error) {
      this.handleDuplicateKeyError(error);
    }
  }

  async getAllAcademicSessions(
    schoolId: string,
    queryDto: QueryWithPaginationDto,
  ) {
    this.validateObjectId(schoolId, 'school ID');

    const result =
      await this.academicSessionsRepository.findAllAcademicSessions(
        schoolId,
        queryDto,
      );

    if (!result.sessionObj || result.sessionObj.length === 0) {
      throw new NotFoundException({
        message: 'Academic sessions not found.',
        success: false,
        status: 404,
      });
    }

    return result;
  }

  async getAcademicSessionById(schoolId: string, sessionId: string) {
    this.validateObjectId(schoolId, 'school ID');
    this.validateObjectId(sessionId, 'academic session ID');

    const academicSession =
      await this.academicSessionsRepository.findAcademicSessionById(
        schoolId,
        sessionId,
      );

    if (!academicSession) {
      throw new NotFoundException({
        success: false,
        status: 404,
        message: 'Academic session not found.',
      });
    }

    return academicSession;
  }

  async updateAcademicSession(
    schoolId: string,
    sessionId: string,
    updateDto: UpdateAcademicSessionDto,
  ) {
    this.validateObjectId(schoolId, 'school ID');
    this.validateObjectId(sessionId, 'academic session ID');

    const existingSession =
      await this.academicSessionsRepository.findAcademicSessionById(
        schoolId,
        sessionId,
      );

    if (!existingSession) {
      throw new NotFoundException({
        success: false,
        status: 404,
        message: 'Academic session not found.',
      });
    }

    const startDate = updateDto.startDate
      ? new Date(updateDto.startDate)
      : existingSession.startDate;

    const endDate = updateDto.endDate
      ? new Date(updateDto.endDate)
      : existingSession.endDate;

    this.validateDates(startDate, endDate);

    const sessionName =
      updateDto.sessionName?.trim() ?? existingSession.sessionName;

    const sectionName =
      updateDto.sectionName !== undefined
        ? updateDto.sectionName.trim() || null
        : existingSession.sectionName;

    const duplicateSession =
      await this.academicSessionsRepository.findAcademicSessionByName(
        schoolId,
        sessionName,
        sectionName,
        sessionId,
      );

    if (duplicateSession) {
      throw new ConflictException({
        success: false,
        status: 409,
        message:
          'An academic session with this name already exists for this section.',
      });
    }

    const payload: Partial<AcademicSession> = {
      ...updateDto,
      sessionName,
      sectionName,
      startDate,
      endDate,
    };

    try {
      const updatedSession =
        await this.academicSessionsRepository.updateAcademicSession(
          schoolId,
          sessionId,
          payload,
        );

      if (!updatedSession) {
        throw new NotFoundException({
          success: false,
          status: 404,
          message: 'Academic session not found.',
        });
      }

      return updatedSession;
    } catch (error) {
      this.handleDuplicateKeyError(error);
    }
  }

  async updateAcademicSessionStatus(
    schoolId: string,
    sessionId: string,
    updateStatusDto: UpdateAcademicSessionStatusDto,
  ) {
    this.validateObjectId(schoolId, 'school ID');
    this.validateObjectId(sessionId, 'academic session ID');

    const existingSession =
      await this.academicSessionsRepository.findAcademicSessionById(
        schoolId,
        sessionId,
      );

    if (!existingSession) {
      throw new NotFoundException({
        success: false,
        status: 404,
        message: 'Academic session not found.',
      });
    }

    const updatedSession =
      await this.academicSessionsRepository.updateAcademicSessionStatus(
        schoolId,
        sessionId,
        updateStatusDto.status,
      );

    if (!updatedSession) {
      throw new NotFoundException({
        success: false,
        status: 404,
        message: 'Academic session not found.',
      });
    }

    return updatedSession;
  }

  async getAcademicSessionStats(schoolId: string) {
    this.validateObjectId(schoolId, 'school ID');

    const total =
      await this.academicSessionsRepository.countAcademicSessions(schoolId);

    return {
      total,
    };
  }

  private validateObjectId(id: string, fieldName: string): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException({
        success: false,
        status: 400,
        message: `Invalid ${fieldName}.`,
      });
    }
  }

  private validateDates(startDate: Date, endDate: Date): void {
    if (Number.isNaN(startDate.getTime())) {
      throw new BadRequestException({
        success: false,
        status: 400,
        message: 'Invalid academic session start date.',
      });
    }

    if (Number.isNaN(endDate.getTime())) {
      throw new BadRequestException({
        success: false,
        status: 400,
        message: 'Invalid academic session end date.',
      });
    }

    if (startDate >= endDate) {
      throw new BadRequestException({
        success: false,
        status: 400,
        message: 'The session end date must be after the start date.',
      });
    }
  }

  private handleDuplicateKeyError(error: any): never {
    if (error?.code === 11000) {
      throw new ConflictException({
        success: false,
        status: 409,
        message:
          'An academic session with this name already exists for this section.',
      });
    }

    throw error;
  }
}
