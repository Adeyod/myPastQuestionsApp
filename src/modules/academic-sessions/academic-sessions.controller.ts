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
import type { SchoolDocument } from '../schools/schemas/schools.schema';
import { Role } from '../users/schemas/user.schema';
import { AcademicSessionsService } from './academic-sessions.service';
import { CreateAcademicSessionDto } from './dtos/create-academic-session.dto';
import { UpdateAcademicSessionStatusDto } from './dtos/update-academic-session-status.dto';
import { UpdateAcademicSessionDto } from './dtos/update-academic-session.dto';

@Controller('academic-sessions')
export class AcademicSessionsController {
  constructor(
    private readonly academicSessionsService: AcademicSessionsService,
  ) {}

  @Post('create-academic-session')
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
  @SuccessMessage('Academic session created successfully.')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create an academic session.',
    description:
      'This is the endpoint that owner or school admin is going to use to Create an academic session.',
  })
  @ApiResponse({
    status: 200,
    description: 'Academic session created successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to create academic session.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async createAcademicSession(
    @CurrentSchool() school: SchoolDocument,
    @Body() createDto: CreateAcademicSessionDto,
  ) {
    const response = await this.academicSessionsService.createAcademicSession(
      school._id.toString(),
      createDto,
    );

    return response;
  }

  @Get('get-all-academic-sessions-of-a-school')
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
  @SuccessMessage('Academic sessions fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all academic sessions.',
    description:
      'This is the endpoint to Get all academic sessions of a school.',
  })
  @ApiResponse({
    status: 200,
    description: 'Academic sessions fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch academic sessions.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async getAllAcademicSessions(
    @CurrentSchool() school: SchoolDocument,
    @Query() queryDto: QueryWithPaginationDto,
  ) {
    const response = await this.academicSessionsService.getAllAcademicSessions(
      school._id.toString(),
      queryDto,
    );

    return response;
  }

  @Get('get-academic-session-by-sessionId/:sessionId')
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
  @SuccessMessage('Academic session fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get an academic session by ID.',
    description: 'This is the endpoint to Get an academic session by ID.',
  })
  @ApiResponse({
    status: 200,
    description: 'Academic session fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch academic session.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async getAcademicSessionById(
    @CurrentSchool() school: SchoolDocument,
    @Param('sessionId') sessionId: string,
  ) {
    const response = await this.academicSessionsService.getAcademicSessionById(
      school._id.toString(),
      sessionId,
    );

    return response;
  }

  @Patch('update-academic-session-by-sessionId/:sessionId')
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
  @SuccessMessage('Academic session updated successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update an academic session.',
    description: 'This is the endpoint to Update an academic session.',
  })
  @ApiResponse({
    status: 200,
    description: 'Academic session updated successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to update academic session.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async updateAcademicSession(
    @CurrentSchool() school: SchoolDocument,
    @Param('sessionId') sessionId: string,
    @Body() updateDto: UpdateAcademicSessionDto,
  ) {
    const response = await this.academicSessionsService.updateAcademicSession(
      school._id.toString(),
      sessionId,
      updateDto,
    );

    return response;
  }

  @Patch('update-academic-session-status/:sessionId/status')
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
  @SuccessMessage('Academic session status updated successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update academic session status.',
    description: 'This is the endpoint to Update academic session status.',
  })
  @ApiResponse({
    status: 200,
    description: 'Academic session status updated successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to update academic session status.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async updateAcademicSessionStatus(
    @CurrentSchool() school: SchoolDocument,
    @Param('sessionId') sessionId: string,
    @Body() updateStatusDto: UpdateAcademicSessionStatusDto,
  ) {
    const response =
      await this.academicSessionsService.updateAcademicSessionStatus(
        school._id.toString(),
        sessionId,
        updateStatusDto,
      );

    return response;
  }
}
