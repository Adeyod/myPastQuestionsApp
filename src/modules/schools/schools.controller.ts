import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
import { CurrentSchoolMembership } from '../../common/decorators/current-school-membership.decorator';
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
import {
  type SchoolMembershipDocument,
  SchoolRole,
} from '../school-memberships/schemas/school-membership.schema';
import { Role } from '../users/schemas/user.schema';
import { CreateSchoolDto } from './dtos/create-school.dto';
import type { SchoolDocument } from './schemas/schools.schema';
import { SchoolsService } from './schools.service';

@Controller('schools')
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}
  @Post('create-school')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: '394ir-84736e5362-yw7qy3i38',
  })
  @SuccessMessage('School created successfully.')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'create school.',
    description: 'This is the endpoint that admin uses to create school.',
  })
  @ApiResponse({
    status: 200,
    description: 'School created successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to create school.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async createSchool(@Body() createSchoolDto: CreateSchoolDto) {
    const response = await this.schoolsService.createSchool(createSchoolDto);

    return response;
  }
  @Get('get-school-dashboard/:schoolId')
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
  @SuccessMessage('School dashboard fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fetch school.',
    description: 'This is the endpoint to fetch school dashboard.',
  })
  @ApiResponse({
    status: 200,
    description: 'School dashboard fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch school dashboard.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async getSchoolDashboardBySchoolId(
    @Param('schoolId') schoolId: string,
    @CurrentSchool() school: SchoolDocument,
    @CurrentSchoolMembership() member: SchoolMembershipDocument,
  ) {
    const response = await this.schoolsService.getSchoolDashboardBySchoolId(
      schoolId,
      school,
      member,
    );

    return response;
  }
  @Get('get-school-by-schoolId/:schoolId')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard, RolesGuard)
  @Roles(Role.USER, Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: '394ir-84736e5362-yw7qy3i38',
  })
  @SuccessMessage('School fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fetch school.',
    description: 'This is the endpoint to fetch school.',
  })
  @ApiResponse({
    status: 200,
    description: 'School fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch school.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async getSchoolBySchoolId(@Param('schoolId') schoolId: string) {
    const response = await this.schoolsService.getSchoolBySchoolId(schoolId);

    return response;
  }
  @Get('get-school-by-subdomain/:subdomain')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: '394ir-84736e5362-yw7qy3i38',
  })
  @SuccessMessage('School fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fetch school.',
    description: 'This is the endpoint to fetch school.',
  })
  @ApiResponse({
    status: 200,
    description: 'School fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch school.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async getSchoolBySubdomain(@Param('subdomain') subdomain: string) {
    const response = await this.schoolsService.getSchoolBySubdomain(subdomain);

    return response;
  }
  @Get('get-all-schools')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: '394ir-84736e5362-yw7qy3i38',
  })
  @SuccessMessage('Schools fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fetch all schools.',
    description: 'This is the endpoint to fetch all schools.',
  })
  @ApiResponse({
    status: 200,
    description: 'Schools fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch schools.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async getAllSchools(@Query() query: QueryWithPaginationDto) {
    const response = await this.schoolsService.getAllSchools(query);

    return response;
  }
}
