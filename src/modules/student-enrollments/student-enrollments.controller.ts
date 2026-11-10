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

import { StudentEnrollmentsService } from './student-enrollments.service';

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
import { CreateStudentEnrollmentDto } from './dtos/create-student-enrollment.dto';
import { UpdateStudentEnrollmentStatusDto } from './dtos/update-student-enrollment-status.dto';
import { UpdateStudentEnrollmentDto } from './dtos/update-student-enrollment.dto';
import { StudentEnrollmentStatus } from './schemas/student-enrollment.schema';

@Controller('school/academic-sessions/:academicSessionId/enrollments')
export class StudentEnrollmentsController {
  constructor(
    private readonly studentEnrollmentsService: StudentEnrollmentsService,
  ) {}

  @Post('enrol-student-into-a-class')
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
  @SuccessMessage('Student enrolled successfully.')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Enrol a student into a class.',
    description:
      'This is the endpoint that owner or school admin is going to use to Enrol a student into a class.',
  })
  @ApiResponse({
    status: 200,
    description: 'Student enrolled successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to enroll student.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async createStudentEnrollment(
    @CurrentSchool() school: any,
    @Param('academicSessionId') academicSessionId: string,
    @Body() createDto: CreateStudentEnrollmentDto,
  ) {
    const response =
      await this.studentEnrollmentsService.createStudentEnrollment(
        school._id.toString(),
        academicSessionId,
        createDto,
      );

    return response;
  }

  @Get('get-student-enrollment-in-academic-session')
  @UseGuards(
    JwtAuthGuard,
    DeviceSessionGuard,
    RolesGuard,
    SchoolMembershipGuard,
    SchoolRolesGuard,
  )
  @Roles(Role.USER)
  @SchoolRoles(SchoolRole.OWNER, SchoolRole.ADMIN, SchoolRole.TEACHER)
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
  @SuccessMessage('Student enrollment fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get student enrolments in an academic session.',
    description:
      'This is the endpoint that teachers, owner or school admin is going to use to Get student enrolments in an academic session.',
  })
  @ApiResponse({
    status: 200,
    description: 'Student enrollment fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request. Unable to Get student enrolments in an academic session.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async findAllStudentEnrollments(
    @CurrentSchool() school: any,
    @Param('academicSessionId') academicSessionId: string,
    @Query() queryDto: QueryWithPaginationDto,
  ) {
    const response =
      await this.studentEnrollmentsService.findAllStudentEnrollments(
        school._id.toString(),
        academicSessionId,
        queryDto,
      );

    return response;
  }

  @Get('count-class-enrollments')
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
  @SuccessMessage('Student enrollment counted successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Count student enrolments in a class.',
    description:
      'This is the endpoint that owner or school admin is going to use to Count student enrolments in a class.',
  })
  @ApiResponse({
    status: 200,
    description: 'Student enrollment counted successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to Count student enrolments.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async countStudentEnrollments(
    @CurrentSchool() school: any,
    @Param('academicSessionId') academicSessionId: string,
    @Query('classId') classId?: string,
    @Query('status') status?: StudentEnrollmentStatus,
  ) {
    const response =
      await this.studentEnrollmentsService.countStudentEnrollments(
        school._id.toString(),
        academicSessionId,
        classId,
        status,
      );

    return response;
  }

  @Get('get-student-enrollment-by-enrollmentId/:enrollmentId')
  @UseGuards(
    JwtAuthGuard,
    DeviceSessionGuard,
    RolesGuard,
    SchoolMembershipGuard,
    SchoolRolesGuard,
  )
  @Roles(Role.USER)
  @SchoolRoles(SchoolRole.OWNER, SchoolRole.ADMIN, SchoolRole.TEACHER)
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
  @SuccessMessage('Student enrollment fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get a student enrolment by ID.',
    description:
      'This is the endpoint that teacher, owner or school admin is going to use to Get a student enrolment by ID.',
  })
  @ApiResponse({
    status: 200,
    description: 'Student enrollment fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to Get student enrolment by ID.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async findStudentEnrollmentById(
    @CurrentSchool() school: any,
    @Param('academicSessionId') academicSessionId: string,
    @Param('enrollmentId') enrollmentId: string,
  ) {
    const response =
      await this.studentEnrollmentsService.findStudentEnrollmentById(
        school._id.toString(),
        academicSessionId,
        enrollmentId,
      );

    return response;
  }

  @Post('transfer-student-to-another-class/:enrollmentId/transfer')
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
  @SuccessMessage('Student transfered successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Transfer student to another class.',
    description:
      'This is the endpoint that owner or school admin is going to use to Transfer a student to another class.',
  })
  @ApiResponse({
    status: 200,
    description: 'Student transfered successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to Transfer student to another class.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async transferStudentEnrollment(
    @CurrentSchool() school: any,
    @Param('academicSessionId') academicSessionId: string,
    @Param('enrollmentId') enrollmentId: string,
    @Body() updateDto: UpdateStudentEnrollmentDto,
  ) {
    const response =
      await this.studentEnrollmentsService.transferStudentEnrollment(
        school._id.toString(),
        academicSessionId,
        enrollmentId,
        updateDto,
      );

    return response;
  }

  @Patch('complete-or-withdraw-student-enrollment/:enrollmentId/status')
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
  @SuccessMessage('Student enrollment status updated successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Complete or withdraw a student enrolment.',
    description:
      'This is the endpoint that owner or school admin is going to use to Complete or withdraw a student enrolment.',
  })
  @ApiResponse({
    status: 200,
    description: 'Student enrollment status updated successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to update student enrollment status.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async updateStudentEnrollmentStatus(
    @CurrentSchool() school: any,
    @Param('academicSessionId') academicSessionId: string,
    @Param('enrollmentId') enrollmentId: string,
    @Body() updateDto: UpdateStudentEnrollmentStatusDto,
  ) {
    const response =
      this.studentEnrollmentsService.updateStudentEnrollmentStatus(
        school._id.toString(),
        academicSessionId,
        enrollmentId,
        updateDto,
      );

    return response;
  }
}
