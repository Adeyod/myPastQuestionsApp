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
import { type SchoolDocument } from '../schools/schemas/schools.schema';
import { Role } from '../users/schemas/user.schema';
import { CreateStudentEnrollmentDto } from './dtos/create-student-enrollment.dto';
import { UpdateStudentEnrollmentStatusDto } from './dtos/update-student-enrollment-status.dto';

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
    @CurrentSchool() school: SchoolDocument,
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

  @Get('get-all-enrollments-in-academic-session-for-a-school')
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
  @SuccessMessage('School session enrollments fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get school enrolments in an academic session.',
    description:
      'This is the endpoint that teachers, owner or school admin is going to use to Get school enrolments in an academic session.',
  })
  @ApiResponse({
    status: 200,
    description: 'School session enrollments fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request. Unable to Get school enrolments in an academic session.',
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
    @CurrentSchool() school: SchoolDocument,
    @Param('academicSessionId') academicSessionId: string,
    @Query() queryDto: QueryWithPaginationDto,
  ) {
    const response =
      await this.studentEnrollmentsService.findAllEnrollmentsOfASchoolInASession(
        school._id.toString(),
        academicSessionId,
        queryDto,
      );
    return response;
  }

  @Get('count-total-enrollments-in-a-session')
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
    summary: 'Count number of student enrolments in a session.',
    description:
      'This is the endpoint that owner or school admin is going to use to Count student enrolments in a session.',
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
    @CurrentSchool() school: SchoolDocument,
    @Param('academicSessionId') academicSessionId: string,
  ) {
    const response =
      await this.studentEnrollmentsService.countStudentEnrollments(
        school._id.toString(),
        academicSessionId,
      );
    return response;
  }

  @Get('count-total-enrollments-in-a-class-in-a-session')
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
    summary: 'Count number of student enrolments in a class in a session.',
    description:
      'This is the endpoint that owner or school admin is going to use to Count student enrolments in a class in a session.',
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
  async countStudentEnrollmentsInAClass(
    @CurrentSchool() school: SchoolDocument,
    @Param('academicSessionId') academicSessionId: string,
    @Query('classId') classId: string,
  ) {
    const response =
      await this.studentEnrollmentsService.countStudentEnrollmentsInAClass(
        school._id.toString(),
        academicSessionId,
        classId,
      );
    return response;
  }

  @Get('get-enrollment-by-enrollmentId/:enrollmentId')
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
  @SuccessMessage('Class enrollment fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get a class enrolment by enrollment ID.',
    description:
      'This is the endpoint that teacher, owner or school admin is going to use to Get a class enrolment by enrollment ID.',
  })
  @ApiResponse({
    status: 200,
    description: 'Class enrollment fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to Get class enrolment by ID.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async findClassEnrollmentById(
    @CurrentSchool() school: SchoolDocument,
    @Param('academicSessionId') academicSessionId: string,
    @Param('enrollmentId') enrollmentId: string,
  ) {
    const response =
      await this.studentEnrollmentsService.findClassEnrollmentById(
        school._id.toString(),
        academicSessionId,
        enrollmentId,
      );

    return response;
  }

  // @Post('transfer-student-to-another-class/:enrollmentId/transfer')
  // @UseGuards(
  //   JwtAuthGuard,
  //   DeviceSessionGuard,
  //   RolesGuard,
  //   SchoolMembershipGuard,
  //   SchoolRolesGuard,
  // )
  // @Roles(Role.USER)
  // @SchoolRoles(SchoolRole.OWNER, SchoolRole.ADMIN)
  // @ApiBearerAuth('JWT-auth')
  // @ApiHeader({
  //   name: 'x-school-subdomain',
  //   description: 'Subdomain identifying the school being accessed.',
  //   required: true,
  //   example: 'csae',
  // })
  // @ApiHeader({
  //   name: 'x-device-id',
  //   description: 'Unique device identifier for the user session',
  //   required: true,
  //   example: '394ir-84736e5362-yw7qy3i38',
  // })
  // @SuccessMessage('Student transfered successfully.')
  // @HttpCode(HttpStatus.OK)
  // @ApiOperation({
  //   summary: 'Transfer student to another class.',
  //   description:
  //     'This is the endpoint that owner or school admin is going to use to Transfer a student to another class.',
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Student transfered successfully.',
  //   type: ApiResponseDto,
  // })
  // @ApiResponse({
  //   status: 400,
  //   description: 'Bad request. Unable to Transfer student to another class.',
  // })
  // @ApiResponse({
  //   status: 500,
  //   description: 'Internal server error',
  // })
  // @ApiResponse({
  //   status: 429,
  //   description: 'Too many requests. Rate limit exceeded',
  // })
  // async transferStudentEnrollment(
  //   @CurrentSchool() school: SchoolDocument,
  //   @Param('academicSessionId') academicSessionId: string,
  //   @Param('enrollmentId') enrollmentId: string,
  //   @Param('schoolMembershipId') schoolMembershipId: string,
  //   @Body() updateDto: UpdateStudentEnrollmentDto,
  // ) {
  //   const response =
  //     await this.studentEnrollmentsService.transferStudentEnrollment(
  //       school._id.toString(),
  //       academicSessionId,
  //       enrollmentId,
  //       schoolMembershipId,
  //       updateDto,
  //     );

  //   return response;
  // }

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
    @CurrentSchool() school: SchoolDocument,
    @Param('academicSessionId') academicSessionId: string,
    @Param('enrollmentId') enrollmentId: string,
    @Param('schoolMembershipId') schoolMembershipId: string,
    @Body() updateDto: UpdateStudentEnrollmentStatusDto,
  ) {
    const response =
      await this.studentEnrollmentsService.updateStudentEnrollmentStatus(
        school._id.toString(),
        academicSessionId,
        enrollmentId,
        schoolMembershipId,
        updateDto,
      );

    return response;
  }

  @Get('get-active-enrollment-of-a-student-in-a-session/:schoolMembershipId')
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
  @SuccessMessage('Student active enrollment fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get the active enrollment of a student in a session.',
    description:
      'This is the endpoint that teacher, owner or school admin is going to use to Get active enrollment of a student in a session.',
  })
  @ApiResponse({
    status: 200,
    description: 'Student active enrollment fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to Get student active enrollment.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async findActiveStudentEnrollment(
    @CurrentSchool() school: SchoolDocument,
    @Param('academicSessionId') academicSessionId: string,
    @Param('schoolMembershipId') schoolMembershipId: string,
  ) {
    console.log('schoolMembershipId:', schoolMembershipId);
    const response =
      await this.studentEnrollmentsService.findActiveStudentEnrollment(
        school._id.toString(),
        academicSessionId,
        schoolMembershipId,
      );

    return response;
  }
}
