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

import { DeviceSessionGuard } from '../../common/guards/device-session.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SchoolMembershipGuard } from '../../common/guards/school-membership.guard';
import { SchoolRolesGuard } from '../../common/guards/school-roles.guard';

import { CurrentSchool } from '../../common/decorators/current-school.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { SchoolRoles } from '../../common/decorators/school-roles.decorator';

import { SuccessMessage } from '../../common/decorators/success-message.decorator';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { QueryWithPaginationDto } from '../../common/dto/query-with-pagination';
import { SchoolRole } from '../school-memberships/schemas/school-membership.schema';
import type { SchoolDocument } from '../schools/schemas/schools.schema';
import { Role } from '../users/schemas/user.schema';
import { CreateSchoolSubjectDto } from './dtos/create-subject.dto';
import { UpdateSchoolSubjectStatusDto } from './dtos/update-subject-status.dto';
import { UpdateSchoolSubjectDto } from './dtos/update-subject.dto';
import { SchoolSubjectsService } from './school-subjects.service';

@Controller('school/subjects')
export class SchoolSubjectsController {
  constructor(private readonly subjectsService: SchoolSubjectsService) {}

  @Post('create-a-school-subject')
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
  @SuccessMessage('Subject created successfully.')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a school subject',
    description: 'Creation of school subject.',
  })
  @ApiResponse({
    status: 201,
    description: 'Subject created successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to create subject.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async createSubject(
    @Body() createSubjectDto: CreateSchoolSubjectDto,
    @CurrentSchool() school: SchoolDocument,
  ) {
    return await this.subjectsService.createSubject(
      school._id.toString(),
      createSubjectDto,
    );
  }

  @Get('get-all-school-sujects')
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
    SchoolRole.STUDENT,
    SchoolRole.TEACHER,
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
  @SuccessMessage('Subjects fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fetch school subjects',
    description: 'Get all subjects belonging to a school.',
  })
  @ApiResponse({
    status: 201,
    description: 'Subjects fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch subjects.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async getAllSchoolSubjects(
    @Query() queryDto: QueryWithPaginationDto,
    @CurrentSchool() school: SchoolDocument,
  ) {
    return await this.subjectsService.getAllSchoolSubjects(
      school._id.toString(),
      queryDto,
    );
  }

  @Get('get-a-school-subject/:subjectId')
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
    SchoolRole.STUDENT,
    SchoolRole.STUDENT,
    SchoolRole.TEACHER,
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
  @SuccessMessage('Subject fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get a school subject by ID',
    description: 'Get a school subject by ID.',
  })
  @ApiResponse({
    status: 201,
    description: 'Subject fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch subject.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async getSchoolSubjectById(
    @Param('subjectId') subjectId: string,
    @CurrentSchool() school: SchoolDocument,
  ) {
    return await this.subjectsService.getSchoolSubjectById(
      school._id.toString(),
      subjectId,
    );
  }

  @Patch('update-school-subject/:subjectId')
  @SchoolRoles(SchoolRole.OWNER, SchoolRole.ADMIN)
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
  @SuccessMessage('Subject updated successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update a school subject',
    description: 'Update a school subject.',
  })
  @ApiResponse({
    status: 201,
    description: 'Subject updated successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to update subject.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async updateSchoolSubject(
    @Param('subjectId') subjectId: string,
    @Body() updateSubjectDto: UpdateSchoolSubjectDto,
    @CurrentSchool() school: SchoolDocument,
  ) {
    return await this.subjectsService.updateSchoolSubject(
      school._id.toString(),
      subjectId,
      updateSubjectDto,
    );
  }

  @Patch(':subjectId/status')
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
  @SuccessMessage('Subject active status updated successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Activate or deactivate a school subject',
    description: 'Activate or deactivate a school subject.',
  })
  @ApiResponse({
    status: 201,
    description: 'Subject active status updated successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to update subject active status.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async updateSchoolSubjectStatus(
    @Param('subjectId') subjectId: string,
    @Body() updateSubjectStatusDto: UpdateSchoolSubjectStatusDto,
    @CurrentSchool() school: SchoolDocument,
  ) {
    return await this.subjectsService.updateSchoolSubjectStatus(
      school._id.toString(),
      subjectId,
      updateSubjectStatusDto.isActive,
    );
  }
}
