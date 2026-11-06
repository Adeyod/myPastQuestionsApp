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
import { SchoolRole } from '../school-memberships/schemas/school-membership.schema';
import type { SchoolDocument } from '../schools/schemas/schools.schema';
import { Role } from '../users/schemas/user.schema';

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
    example: 'greater-tomorrow',
  })
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: '394ir-84736e5362-yw7qy3i38',
  })
  @SuccessMessage(
    'Registration successful and School membership account created successfully.',
  )
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a school class',
    description: 'Creation of school class.',
  })
  @ApiResponse({
    status: 201,
    description:
      'Registration successful and School membership account created successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request. Unable to register or create school membership account for this user.',
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

  @Get()
  @ApiOperation({ summary: 'Get all classes belonging to a school' })
  async getAllSchoolClasses(@CurrentSchool() school: SchoolDocument) {
    return await this.classesService.getAllSchoolClasses(school._id.toString());
  }

  @Get(':classId')
  @ApiOperation({ summary: 'Get a school class by ID' })
  async getSchoolClassById(
    @Param('classId') classId: string,
    @CurrentSchool() school: SchoolDocument,
  ) {
    return await this.classesService.getSchoolClassById(
      school._id.toString(),
      classId,
    );
  }

  @Patch(':classId')
  @ApiOperation({ summary: 'Update a school class' })
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

  @Patch(':classId/status')
  @ApiOperation({ summary: 'Activate or deactivate a school class' })
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
}
