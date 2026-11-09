import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isValidObjectId, Types } from 'mongoose';

import { CreateAcademicPeriodDto } from './dtos/create-academic-period.dto';
import { UpdateAcademicPeriodStatusDto } from './dtos/update-academic-period-status.dto';
import { UpdateAcademicPeriodDto } from './dtos/update-academic-period.dto';

import { QueryWithPaginationDto } from '../../common/dto/query-with-pagination';
import { AcademicSessionsService } from '../academic-sessions/academic-sessions.service';
import { AcademicPeriodsRepository } from './repositories/academic-periods.repository';

@Injectable()
export class AcademicPeriodsService {
  constructor(
    private readonly academicPeriodsRepository: AcademicPeriodsRepository,
    private readonly academicSessionsService: AcademicSessionsService,
  ) {}

  async createAcademicPeriod(
    schoolId: string,
    academicSessionId: string,
    createDto: CreateAcademicPeriodDto,
  ) {
    this.validateObjectId(schoolId, 'school ID');
    this.validateObjectId(academicSessionId, 'academic session ID');

    const session = await this.findSessionOrThrow(schoolId, academicSessionId);

    const startDate = new Date(createDto.startDate);
    const endDate = new Date(createDto.endDate);

    this.validatePeriodDates(startDate, endDate);

    this.validateSessionDateRange(
      startDate,
      endDate,
      session.startDate,
      session.endDate,
    );

    const periodName = createDto.periodName.trim();

    const existingPeriodByName =
      await this.academicPeriodsRepository.findAcademicPeriodByName(
        schoolId,
        academicSessionId,
        periodName,
      );

    if (existingPeriodByName) {
      throw new ConflictException({
        message:
          'An academic period with this name already exists in this session.',
        success: false,
        status: 409,
      });
    }

    const existingPeriodByNumber =
      await this.academicPeriodsRepository.findAcademicPeriodByNumber(
        schoolId,
        academicSessionId,
        createDto.periodNumber,
      );

    if (existingPeriodByNumber) {
      throw new ConflictException({
        message:
          'An academic period with this number already exists in this session.',
        success: false,
        status: 409,
      });
    }

    const overlappingPeriod =
      await this.academicPeriodsRepository.findOverlappingAcademicPeriod(
        schoolId,
        academicSessionId,
        startDate,
        endDate,
      );

    if (overlappingPeriod) {
      throw new ConflictException({
        message: `This period overlaps with "${overlappingPeriod.periodName}".`,
        success: false,
        status: 409,
      });
    }

    const academicPeriod =
      await this.academicPeriodsRepository.createAcademicPeriod({
        schoolId: new Types.ObjectId(schoolId),
        academicSessionId: new Types.ObjectId(academicSessionId),
        periodName,
        periodNumber: createDto.periodNumber,
        startDate,
        endDate,
      });

    if (!academicPeriod) {
      throw new BadRequestException({
        message: 'Unable to create academic period.',
        success: false,
        status: 400,
      });
    }

    return academicPeriod;
  }

  async findAllAcademicPeriods(
    schoolId: string,
    academicSessionId: string,
    queryDto: QueryWithPaginationDto,
  ) {
    this.validateObjectId(schoolId, 'school ID');
    this.validateObjectId(academicSessionId, 'academic session ID');

    await this.findSessionOrThrow(schoolId, academicSessionId);

    const result = await this.academicPeriodsRepository.findAllAcademicPeriods(
      schoolId,
      academicSessionId,
      queryDto,
    );

    if (!result.academicPeriodObj || result.academicPeriodObj.length === 0) {
      throw new NotFoundException({
        message: 'Academic periods not found.',
        success: false,
        status: 404,
      });
    }

    return result;
  }

  async findAcademicPeriodById(
    schoolId: string,
    academicSessionId: string,
    periodId: string,
  ) {
    this.validateObjectId(schoolId, 'school ID');
    this.validateObjectId(academicSessionId, 'academic session ID');
    this.validateObjectId(periodId, 'academic period ID');

    await this.findSessionOrThrow(schoolId, academicSessionId);

    const academicPeriod = await this.findPeriodOrThrow(
      schoolId,
      academicSessionId,
      periodId,
    );

    return academicPeriod;
  }

  async updateAcademicPeriod(
    schoolId: string,
    academicSessionId: string,
    periodId: string,
    updateDto: UpdateAcademicPeriodDto,
  ) {
    this.validateObjectId(schoolId, 'school ID');
    this.validateObjectId(academicSessionId, 'academic session ID');
    this.validateObjectId(periodId, 'academic period ID');

    const session = await this.findSessionOrThrow(schoolId, academicSessionId);

    const existingPeriod = await this.findPeriodOrThrow(
      schoolId,
      academicSessionId,
      periodId,
    );

    const periodName =
      updateDto.periodName?.trim() ?? existingPeriod.periodName;

    const periodNumber = updateDto.periodNumber ?? existingPeriod.periodNumber;

    const startDate = updateDto.startDate
      ? new Date(updateDto.startDate)
      : existingPeriod.startDate;

    const endDate = updateDto.endDate
      ? new Date(updateDto.endDate)
      : existingPeriod.endDate;

    this.validatePeriodDates(startDate, endDate);

    this.validateSessionDateRange(
      startDate,
      endDate,
      session.startDate,
      session.endDate,
    );

    const existingPeriodByName =
      await this.academicPeriodsRepository.findAcademicPeriodByName(
        schoolId,
        academicSessionId,
        periodName,
        periodId,
      );

    if (existingPeriodByName) {
      throw new ConflictException({
        message:
          'An academic period with this name already exists in this session.',
        success: false,
        status: 409,
      });
    }

    const existingPeriodByNumber =
      await this.academicPeriodsRepository.findAcademicPeriodByNumber(
        schoolId,
        academicSessionId,
        periodNumber,
        periodId,
      );

    if (existingPeriodByNumber) {
      throw new ConflictException({
        message:
          'An academic period with this number already exists in this session.',
        success: false,
        status: 409,
      });
    }

    const overlappingPeriod =
      await this.academicPeriodsRepository.findOverlappingAcademicPeriod(
        schoolId,
        academicSessionId,
        startDate,
        endDate,
        periodId,
      );

    if (overlappingPeriod) {
      throw new ConflictException({
        message: `This period overlaps with "${overlappingPeriod.periodName}".`,
        success: false,
        status: 409,
      });
    }

    const academicPeriod =
      await this.academicPeriodsRepository.updateAcademicPeriod(
        schoolId,
        academicSessionId,
        periodId,
        {
          periodName,
          periodNumber,
          startDate,
          endDate,
        },
      );

    if (!academicPeriod) {
      throw new NotFoundException({
        message: 'Academic period not found.',
        success: false,
        status: 404,
      });
    }

    return academicPeriod;
  }

  async updateAcademicPeriodStatus(
    schoolId: string,
    academicSessionId: string,
    periodId: string,
    updateStatusDto: UpdateAcademicPeriodStatusDto,
  ) {
    this.validateObjectId(schoolId, 'school ID');
    this.validateObjectId(academicSessionId, 'academic session ID');
    this.validateObjectId(periodId, 'academic period ID');

    await this.findSessionOrThrow(schoolId, academicSessionId);

    await this.findPeriodOrThrow(schoolId, academicSessionId, periodId);

    const academicPeriod =
      await this.academicPeriodsRepository.updateAcademicPeriodStatus(
        schoolId,
        academicSessionId,
        periodId,
        updateStatusDto.status,
      );

    if (!academicPeriod) {
      throw new NotFoundException({
        message: 'Academic period not found.',
        success: false,
        status: 404,
      });
    }

    return academicPeriod;
  }

  async deleteAcademicPeriod(
    schoolId: string,
    academicSessionId: string,
    periodId: string,
  ) {
    this.validateObjectId(schoolId, 'school ID');
    this.validateObjectId(academicSessionId, 'academic session ID');
    this.validateObjectId(periodId, 'academic period ID');

    await this.findSessionOrThrow(schoolId, academicSessionId);

    await this.findPeriodOrThrow(schoolId, academicSessionId, periodId);

    const academicPeriod =
      await this.academicPeriodsRepository.deleteAcademicPeriod(
        schoolId,
        academicSessionId,
        periodId,
      );

    if (!academicPeriod) {
      throw new NotFoundException({
        message: 'Academic period not found.',
        success: false,
        status: 404,
      });
    }

    return {
      success: true,
      message: 'Academic period deleted successfully.',
    };
  }

  async countAcademicPeriods(schoolId: string, academicSessionId?: string) {
    this.validateObjectId(schoolId, 'school ID');

    if (academicSessionId) {
      this.validateObjectId(academicSessionId, 'academic session ID');
      await this.findSessionOrThrow(schoolId, academicSessionId);
    }

    const total = await this.academicPeriodsRepository.countAcademicPeriods(
      schoolId,
      academicSessionId,
    );

    return total;
  }

  private validatePeriodDates(startDate: Date, endDate: Date): void {
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException({
        message: 'Invalid academic period dates.',
        success: false,
        status: 400,
      });
    }

    if (startDate >= endDate) {
      throw new BadRequestException({
        message: 'Academic period end date must be after its start date.',
        success: false,
        status: 400,
      });
    }
  }

  private validateSessionDateRange(
    startDate: Date,
    endDate: Date,
    sessionStartDate: Date,
    sessionEndDate: Date,
  ): void {
    if (startDate < sessionStartDate || endDate > sessionEndDate) {
      throw new BadRequestException({
        message:
          'Academic period dates must fall within the academic session dates.',
        success: false,
        status: 400,
      });
    }
  }

  private async findSessionOrThrow(
    schoolId: string,
    academicSessionId: string,
  ) {
    const session = await this.academicSessionsService.getAcademicSessionById(
      schoolId,
      academicSessionId,
    );

    return session;
  }

  private async findPeriodOrThrow(
    schoolId: string,
    academicSessionId: string,
    periodId: string,
  ) {
    const period = await this.academicPeriodsRepository.findAcademicPeriodById(
      schoolId,
      academicSessionId,
      periodId,
    );

    if (!period) {
      throw new NotFoundException({
        message: 'Academic period not found.',
        success: false,
        status: 404,
      });
    }

    return period;
  }

  private validateObjectId(id: string, fieldName: string): void {
    if (!isValidObjectId(id)) {
      throw new BadRequestException({
        message: `Invalid ${fieldName}.`,
        success: false,
        status: 400,
      });
    }
  }
}
