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

import { ClassesService } from './classes.service';

import { CreateClassDto } from './dtos/create-class.dto';
import { UpdateClassStatusDto } from './dtos/update-class-status.dto';
import { UpdateClassDto } from './dtos/update-class.dto';

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
import { AddSubjectsToClassDto } from './dtos/add-subject-to-class.dto';
import { RemoveSubjectsFromClassDto } from './dtos/remove-subjects-from-class.dto';

@Controller('classes')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post('create-a-school-class')
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
  @SuccessMessage('Class created successfully.')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a school class',
    description: 'Creation of school class.',
  })
  @ApiResponse({
    status: 201,
    description: 'Class created successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to create class.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async createClass(
    @Body() createClassDto: CreateClassDto,
    @CurrentSchool() school: SchoolDocument,
  ) {
    return await this.classesService.createClass(
      school._id.toString(),
      createClassDto,
    );
  }

  @Get('get-all-classes-for-the-school')
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
  @SuccessMessage('Classes fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fetch classes',
    description: 'Get all classes in a school.',
  })
  @ApiResponse({
    status: 201,
    description: 'Classes fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch classes.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async getAllSchoolClasses(
    @CurrentSchool() school: SchoolDocument,
    @Query() queryDto: QueryWithPaginationDto,
  ) {
    return await this.classesService.getAllSchoolClasses(
      school._id.toString(),
      queryDto,
    );
  }

  @Get('get-single-class-of-a-school/:classId')
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
  @SuccessMessage('Class fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get a class',
    description: 'Get a class in a school.',
  })
  @ApiResponse({
    status: 201,
    description: 'Class fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to get class.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async getSchoolClassById(
    @Param('classId') classId: string,
    @CurrentSchool() school: SchoolDocument,
  ) {
    return await this.classesService.getSchoolClassById(
      school._id.toString(),
      classId,
    );
  }

  @Patch('update-a-class-in-a-school/:classId')
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
  @SuccessMessage('Class updated successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update class',
    description: 'Update a class in a school.',
  })
  @ApiResponse({
    status: 201,
    description: 'Class updated successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to update class.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async updateSchoolClass(
    @Param('classId') classId: string,
    @Body() updateClassDto: UpdateClassDto,
    @CurrentSchool() school: SchoolDocument,
  ) {
    return await this.classesService.updateSchoolClass(
      school._id.toString(),
      classId,
      updateClassDto,
    );
  }

  @Patch('update-class-status/:classId/status')
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
  @SuccessMessage('Class status updated successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Activate or deactivate a school class',
    description: 'Activate or deactivate a school class.',
  })
  @ApiResponse({
    status: 201,
    description: 'Class status updated successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to update class status.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async updateSchoolClassStatus(
    @Param('classId') classId: string,
    @Body() updateClassStatusDto: UpdateClassStatusDto,
    @CurrentSchool() school: SchoolDocument,
  ) {
    return await this.classesService.updateSchoolClassStatus(
      school._id.toString(),
      classId,
      updateClassStatusDto.isActive,
    );
  }
  @Patch('add-subjects-to-class/:classId')
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
  @SuccessMessage('Subjects added to class successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Add new subjects to an existing class',
    description:
      'This endpoint is used to add new subjects or subjects that was not offered in a class before to the class.',
  })
  @ApiResponse({
    status: 201,
    description: 'Subjects added to class successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to add subject to class.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async addSubjectsToClass(
    @Param('classId') classId: string,
    @Body() addSubjectsToClassDto: AddSubjectsToClassDto,
    @CurrentSchool() school: SchoolDocument,
  ) {
    const response = await this.classesService.addSubjectsToClass(
      school._id.toString(),
      classId,
      addSubjectsToClassDto.subjects,
    );

    return response;
  }
  @Patch('remove-subjects-from-class/:classId')
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
  @SuccessMessage('Subjects removed from class successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove subjects from an existing class',
    description:
      'This endpoint is used to remove subjects from an existing class.',
  })
  @ApiResponse({
    status: 201,
    description: 'Subjects removed from class successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to remove subjects from class.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async removeSubjectFromClass(
    @Param('classId') classId: string,
    @Body() removeSubjectsFromClassDto: RemoveSubjectsFromClassDto,
    @CurrentSchool() school: SchoolDocument,
  ) {
    const response = await this.classesService.removeSubjectFromClass(
      school._id.toString(),
      classId,
      removeSubjectsFromClassDto.subjects,
    );

    return response;
  }
}
