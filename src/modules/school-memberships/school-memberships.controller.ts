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

import { CreateSchoolMembershipDto } from './dtos/create-school-membership.dto';
import { UpdateSchoolMembershipRoleDto } from './dtos/update-school-membership-role.dto';
import { UpdateSchoolMembershipStatusDto } from './dtos/update-school-membership-status.dto';

import { SchoolRole } from './schemas/school-membership.schema';

import { Roles } from '../../common/decorators/roles.decorator';
import { SuccessMessage } from '../../common/decorators/success-message.decorator';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { QueryWithPaginationDto } from '../../common/dto/query-with-pagination';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '../users/schemas/user.schema';
import { SchoolMembershipsService } from './school-memberships.service';

@Controller('school-memberships')
export class SchoolMembershipController {
  constructor(
    private readonly schoolMembershipService: SchoolMembershipsService,
  ) {}

  @Post('create-school-membership-account')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: '394ir-84736e5362-yw7qy3i38',
  })
  @SuccessMessage('School membership account created successfully.')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a school membership',
    description: 'Create a school membership',
  })
  @ApiResponse({
    status: 201,
    description: 'School membership account created successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request. Unable to create school membership account for this user.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async createSchoolMember(@Body() payload: CreateSchoolMembershipDto) {
    const membership =
      await this.schoolMembershipService.createSchoolMember(payload);

    return membership;
  }

  @Get('get-school-membership-by-membershipId/:membershipId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: '394ir-84736e5362-yw7qy3i38',
  })
  @SuccessMessage('School membership fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get a school membership by ID',
    description: 'Get a school membership by ID',
  })
  @ApiResponse({
    status: 200,
    description: 'School membership fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request. Unable to get school membership account for this user.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async findSchoolMemberById(@Param('membershipId') membershipId: string) {
    const membership =
      await this.schoolMembershipService.findSchoolMemberById(membershipId);

    return membership;
  }

  @Get('get-all-membership-of-a-school/:schoolId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: '394ir-84736e5362-yw7qy3i38',
  })
  @SuccessMessage('School memberships fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all memberships belonging to a school',
    description: 'Get all memberships belonging to a school',
  })
  @ApiResponse({
    status: 200,
    description: 'School memberships fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch school membership accounts',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async findBySchool(
    @Param('schoolId') schoolId: string,
    @Query() queryDto: QueryWithPaginationDto,
    @Query('role') role?: SchoolRole,
  ) {
    const result = await this.schoolMembershipService.findBySchool(
      schoolId,
      queryDto,
      role,
    );

    return result;
  }

  @Get('get-all-user-school-memberships/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: '394ir-84736e5362-yw7qy3i38',
  })
  @SuccessMessage('User School memberships fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all school memberships belonging to a user',
    description:
      'Get all school memberships belonging to a user. User can belong to more than one school in different capacities',
  })
  @ApiResponse({
    status: 200,
    description: 'User School memberships fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch user school membership accounts',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async findByUser(@Param('userId') userId: string) {
    const memberships = await this.schoolMembershipService.findByUser(userId);

    return {
      success: true,
      status: 200,
      message: 'User school memberships retrieved successfully',
      data: memberships,
    };
  }

  @Patch('update-user-school-membership-role/:membershipId/role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: '394ir-84736e5362-yw7qy3i38',
  })
  @SuccessMessage('User School membership role updated successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update a school membership role',
    description: 'Update a school membership role.',
  })
  @ApiResponse({
    status: 200,
    description: 'User School membership role updated successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to update user school membership role',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async updateSchoolMembershipRole(
    @Param('membershipId') membershipId: string,
    @Body() payload: UpdateSchoolMembershipRoleDto,
  ) {
    const membership =
      await this.schoolMembershipService.updateSchoolMembershipRole(
        membershipId,
        payload.role,
      );

    return membership;
  }

  @Patch('user-school-membership-status-update/:membershipId/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: '394ir-84736e5362-yw7qy3i38',
  })
  @SuccessMessage('User School membership status changed successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Activate or deactivate a school membership',
    description: 'Activate or deactivate a school membership.',
  })
  @ApiResponse({
    status: 200,
    description: 'User School membership status changed successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to change user school membership status',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async updateSchoolMembershipStatus(
    @Param('membershipId') membershipId: string,
    @Body() payload: UpdateSchoolMembershipStatusDto,
  ) {
    const membership =
      await this.schoolMembershipService.updateSchoolMembershipStatus(
        membershipId,
        payload.isActive,
      );

    return membership;
  }
}
