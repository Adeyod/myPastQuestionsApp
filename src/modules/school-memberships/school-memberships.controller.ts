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

import {
  type SchoolMembershipDocument,
  SchoolRole,
} from './schemas/school-membership.schema';

import { CurrentSchoolMembership } from '../../common/decorators/current-school-membership.decorator';
import { CurrentSchool } from '../../common/decorators/current-school.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { SchoolRoles } from '../../common/decorators/school-roles.decorator';
import { SuccessMessage } from '../../common/decorators/success-message.decorator';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { QueryWithPaginationDto } from '../../common/dto/query-with-pagination';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SchoolMembershipGuard } from '../../common/guards/school-membership.guard';
import { SchoolRolesGuard } from '../../common/guards/school-roles.guard';
import type { SchoolDocument } from '../schools/schemas/schools.schema';
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

  @Get('get-school-membership-by-schoolMemberId/:schoolMemberId')
  @UseGuards(JwtAuthGuard, RolesGuard, SchoolMembershipGuard, SchoolRolesGuard)
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
    example: 'greater-tomorrow',
  })
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: '394ir-84736e5362-yw7qy3i38',
  })
  @SuccessMessage('School membership account fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get a school membership by membership ID.',
    description:
      'Members can retrieve their own membership. School owners and admins can retrieve other members within their school.',
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
  async findSchoolMembershipByUserIdAndSchoolId(
    @Param('schoolMemberId') schoolMemberId: string,
    @CurrentSchool() school: SchoolDocument,
    @CurrentSchoolMembership() member: SchoolMembershipDocument,
  ) {
    const membership =
      await this.schoolMembershipService.findSchoolMembershipByUserIdAndSchoolId(
        school,
        member,
        schoolMemberId,
      );

    return membership;
  }

  @Get('get-all-membership-of-a-school/:schoolId')
  @UseGuards(JwtAuthGuard, RolesGuard, SchoolMembershipGuard, SchoolRolesGuard)
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
  ) {
    const result = await this.schoolMembershipService.findBySchool(
      schoolId,
      queryDto,
    );

    return result;
  }

  @Patch('update-user-school-membership-role/:membershipId/role')
  @UseGuards(JwtAuthGuard, RolesGuard, SchoolMembershipGuard, SchoolRolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  @SchoolRoles(SchoolRole.OWNER)
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
  @UseGuards(JwtAuthGuard, RolesGuard, SchoolMembershipGuard, SchoolRolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  @SchoolRoles(SchoolRole.ADMIN)
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
