import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

import { AcademicPeriodsService } from './academic-periods.service';

import { CurrentSchool } from '../../common/decorators/current-school.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { SchoolRoles } from '../../common/decorators/school-roles.decorator';
import { SuccessMessage } from '../../common/decorators/success-message.decorator';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { QueryWithPaginationDto } from '../../common/dto/query-with-pagination';
import { DeviceSessionGuard } from '../../common/guards/device-session.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SchoolMembershipGuard } from '../../common/guards/school-membership.guard';
import { SchoolRolesGuard } from '../../common/guards/school-roles.guard';
import { SchoolRole } from '../school-memberships/schemas/school-membership.schema';
import { Role } from '../users/schemas/user.schema';
import { CreateAcademicPeriodDto } from './dtos/create-academic-period.dto';
import { UpdateAcademicPeriodStatusDto } from './dtos/update-academic-period-status.dto';
import { UpdateAcademicPeriodDto } from './dtos/update-academic-period.dto';

@Controller('school/academic-sessions/:academicSessionId/periods')
export class AcademicPeriodsController {
  constructor(
    private readonly academicPeriodsService: AcademicPeriodsService,
  ) {}

  @Post('create')
  @UseGuards(
    JwtAuthGuard,
    DeviceSessionGuard,
    RolesGuard,
    SchoolMembershipGuard,
    SchoolRolesGuard,
  )
  @Roles(Role.USER)
  @SchoolRoles(SchoolRole.OWNER, SchoolRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-school-subdomain',
    description: 'Subdomain identifying the school being accessed.',
    required: true,
    example: 'csae',
  })
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: '394ir-84736e5362-yw7qy3i38',
  })
  @SuccessMessage('Academic period created successfully.')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create an academic period.',
    description:
      'This is the endpoint that owner or school admin is going to use to Create an academic period.',
  })
  @ApiResponse({
    status: 200,
    description: 'Academic period created successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to create academic period.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async createAcademicPeriod(
    @CurrentSchool() school: any,
    @Param('academicSessionId') academicSessionId: string,
    @Body() createDto: CreateAcademicPeriodDto,
  ) {
    const response = await this.academicPeriodsService.createAcademicPeriod(
      school._id.toString(),
      academicSessionId,
      createDto,
    );

    return response;
  }

  @Get('get-all-academic-period-in-a-session')
  @UseGuards(
    JwtAuthGuard,
    DeviceSessionGuard,
    RolesGuard,
    SchoolMembershipGuard,
    SchoolRolesGuard,
  )
  @Roles(Role.USER)
  @SchoolRoles(
    SchoolRole.OWNER,
    SchoolRole.ADMIN,
    SchoolRole.TEACHER,
    SchoolRole.STUDENT,
  )
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-school-subdomain',
    description: 'Subdomain identifying the school being accessed.',
    required: true,
    example: 'csae',
  })
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: '394ir-84736e5362-yw7qy3i38',
  })
  @SuccessMessage('Academic periods fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all academic periods in a session.',
    description:
      'This is the endpoint that is going to be used to Get all academic periods in a session.',
  })
  @ApiResponse({
    status: 200,
    description: 'Academic periods created successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to create academic periods.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async findAllAcademicPeriods(
    @CurrentSchool() school: any,
    @Param('academicSessionId') academicSessionId: string,
    @Query() queryDto: QueryWithPaginationDto,
  ) {
    const response = await this.academicPeriodsService.findAllAcademicPeriods(
      school._id.toString(),
      academicSessionId,
      queryDto,
    );

    return response;
  }

  @Get('get-academic-period-by-periodId/:periodId')
  @UseGuards(
    JwtAuthGuard,
    DeviceSessionGuard,
    RolesGuard,
    SchoolMembershipGuard,
    SchoolRolesGuard,
  )
  @Roles(Role.USER)
  @SchoolRoles(
    SchoolRole.OWNER,
    SchoolRole.ADMIN,
    SchoolRole.TEACHER,
    SchoolRole.STUDENT,
  )
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-school-subdomain',
    description: 'Subdomain identifying the school being accessed.',
    required: true,
    example: 'csae',
  })
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: '394ir-84736e5362-yw7qy3i38',
  })
  @SuccessMessage('Academic period fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get an academic period by ID.',
    description:
      'This is the endpoint that is going to be used to Get an academic period by ID.',
  })
  @ApiResponse({
    status: 200,
    description: 'Academic period fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch academic period.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async findAcademicPeriodById(
    @CurrentSchool() school: any,
    @Param('academicSessionId') academicSessionId: string,
    @Param('periodId') periodId: string,
  ) {
    const response = await this.academicPeriodsService.findAcademicPeriodById(
      school._id.toString(),
      academicSessionId,
      periodId,
    );

    return response;
  }

  @Patch('update-academic-period/:periodId')
  @UseGuards(
    JwtAuthGuard,
    DeviceSessionGuard,
    RolesGuard,
    SchoolMembershipGuard,
    SchoolRolesGuard,
  )
  @Roles(Role.USER)
  @SchoolRoles(SchoolRole.OWNER, SchoolRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-school-subdomain',
    description: 'Subdomain identifying the school being accessed.',
    required: true,
    example: 'csae',
  })
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: '394ir-84736e5362-yw7qy3i38',
  })
  @SuccessMessage('Academic period updated successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update an academic period.',
    description:
      'This is the endpoint that owner or school admin is going to use to Update an academic period.',
  })
  @ApiResponse({
    status: 200,
    description: 'Academic period updated successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to update academic period.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async updateAcademicPeriod(
    @CurrentSchool() school: any,
    @Param('academicSessionId') academicSessionId: string,
    @Param('periodId') periodId: string,
    @Body() updateDto: UpdateAcademicPeriodDto,
  ) {
    const response = await this.academicPeriodsService.updateAcademicPeriod(
      school._id.toString(),
      academicSessionId,
      periodId,
      updateDto,
    );

    return response;
  }

  @Patch('update-academic-period-status/:periodId/status')
  @UseGuards(
    JwtAuthGuard,
    DeviceSessionGuard,
    RolesGuard,
    SchoolMembershipGuard,
    SchoolRolesGuard,
  )
  @Roles(Role.USER)
  @SchoolRoles(SchoolRole.OWNER, SchoolRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-school-subdomain',
    description: 'Subdomain identifying the school being accessed.',
    required: true,
    example: 'csae',
  })
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: '394ir-84736e5362-yw7qy3i38',
  })
  @SuccessMessage('Academic period status updated successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update academic period status.',
    description:
      'This is the endpoint that owner or school admin is going to use to Update academic period status.',
  })
  @ApiResponse({
    status: 200,
    description: 'Academic period status updated successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to update academic period status.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async updateAcademicPeriodStatus(
    @CurrentSchool() school: any,
    @Param('academicSessionId') academicSessionId: string,
    @Param('periodId') periodId: string,
    @Body() updateStatusDto: UpdateAcademicPeriodStatusDto,
  ) {
    const response =
      await this.academicPeriodsService.updateAcademicPeriodStatus(
        school._id.toString(),
        academicSessionId,
        periodId,
        updateStatusDto,
      );

    return response;
  }
}
