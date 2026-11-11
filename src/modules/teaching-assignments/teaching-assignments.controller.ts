import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

import { CreateTeachingAssignmentDto } from './dtos/create-teaching-assignment.dto';
import { TeachingAssignmentsService } from './teaching-assignments.service';

import { SchoolRole } from '../school-memberships/schemas/school-membership.schema';

import { CurrentSchool } from '../../common/decorators/current-school.decorator';
import { SchoolRoles } from '../../common/decorators/school-roles.decorator';

import { DeviceSessionGuard } from '../../common/guards/device-session.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SchoolMembershipGuard } from '../../common/guards/school-membership.guard';
import { SchoolRolesGuard } from '../../common/guards/school-roles.guard';

import { Roles } from '../../common/decorators/roles.decorator';
import { SuccessMessage } from '../../common/decorators/success-message.decorator';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { type SchoolDocument } from '../schools/schemas/schools.schema';
import { Role } from '../users/schemas/user.schema';

@Controller('school/teaching-assignments')
export class TeachingAssignmentsController {
  constructor(
    private readonly teachingAssignmentsService: TeachingAssignmentsService,
  ) {}

  @Post('assign-teacher-subject-in-a-class')
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
  @SuccessMessage('Teacher assigned successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Assign a teacher to teach a subject in a class',
    description:
      'This is the endpoint to Assign a teacher to teach a subject in a class.',
  })
  @ApiResponse({
    status: 200,
    description: 'Teacher assigned successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to assign teacher to a class.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async createTeachingAssignment(
    @CurrentSchool() school: SchoolDocument,
    @Body() dto: CreateTeachingAssignmentDto,
  ) {
    const response =
      await this.teachingAssignmentsService.createTeachingAssignment(
        school._id.toString(),
        dto,
      );

    return response;
  }

  @Get('get-teacher-assignment-by-assignmentId/:assignmentId')
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
  @SuccessMessage('Teaching assignment fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get a teaching assignment by ID',
    description: 'This is the endpoint to Get a teaching assignment by ID.',
  })
  @ApiResponse({
    status: 200,
    description: 'Teaching assignment fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch teaching assignment.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async getTeachingAssignment(
    @CurrentSchool() school: { _id: string },
    @Param('assignmentId') assignmentId: string,
  ) {
    const response =
      await this.teachingAssignmentsService.getTeachingAssignment(
        school._id.toString(),
        assignmentId,
      );

    return response;
  }

  @Patch('deactivate-teaching-assignment/:assignmentId/deactivate')
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
  @SuccessMessage('Teaching assignment deactivated successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Deactivate a teaching assignment.',
    description: 'This is the endpoint to Deactivate a teaching assignment.',
  })
  @ApiResponse({
    status: 200,
    description: 'Teaching assignment deactivated successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to deactivate teaching assignment.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async deactivateTeachingAssignment(
    @CurrentSchool() school: SchoolDocument,
    @Param('assignmentId') assignmentId: string,
  ) {
    const response =
      await this.teachingAssignmentsService.deactivateTeachingAssignment(
        school._id.toString(),
        assignmentId,
      );

    return response;
  }
}
