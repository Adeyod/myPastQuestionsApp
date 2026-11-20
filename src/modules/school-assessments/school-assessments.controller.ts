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

import { SchoolAssessmentsService } from './school-assessments.service';

import { DeviceSessionGuard } from '../../common/guards/device-session.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SchoolMembershipGuard } from '../../common/guards/school-membership.guard';
import { SchoolRolesGuard } from '../../common/guards/school-roles.guard';

import { CurrentSchoolMembership } from '../../common/decorators/current-school-membership.decorator';
import { CurrentSchool } from '../../common/decorators/current-school.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { SchoolRoles } from '../../common/decorators/school-roles.decorator';

import { SuccessMessage } from '../../common/decorators/success-message.decorator';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { QueryWithPaginationDto } from '../../common/dto/query-with-pagination';
import {
  type SchoolMembershipDocument,
  SchoolRole,
} from '../school-memberships/schemas/school-membership.schema';
import { type SchoolDocument } from '../schools/schemas/schools.schema';
import { Role } from '../users/schemas/user.schema';
import { CreateAssessmentDto } from './dtos/create-assessment.dto';
import { QueryAssessmentsDto } from './dtos/query-assessments.dto';
import { UpdateAssessmentStatusDto } from './dtos/update-assessment-status.dto';

@Controller('school/assessments')
export class SchoolAssessmentsController {
  constructor(
    private readonly schoolAssessmentsService: SchoolAssessmentsService,
  ) {}

  @Post('create-assessment')
  @UseGuards(
    JwtAuthGuard,
    DeviceSessionGuard,
    RolesGuard,
    SchoolMembershipGuard,
    SchoolRolesGuard,
  )
  @Roles(Role.USER)
  @SchoolRoles(SchoolRole.TEACHER)
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
  @SuccessMessage('Assessment created successfully.')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create an assessment with multiple questions.',
    description:
      'This is the endpoint that class subject teacher is going to use to Create an assessment with multiple questions.',
  })
  @ApiResponse({
    status: 200,
    description: 'Assessment created successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to create assessment.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async createAssessment(
    @CurrentSchool() school: SchoolDocument,
    @CurrentSchoolMembership()
    membership: SchoolMembershipDocument,
    @Body() dto: CreateAssessmentDto,
  ) {
    const response = await this.schoolAssessmentsService.createAssessment(
      school._id.toString(),
      membership._id.toString(),
      dto,
    );

    return response;
  }

  @Get('get-all-assessments-of-a-school-in-a-session')
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
  @SuccessMessage('Assessments fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get school assessments in a session',
    description:
      'This is the endpoint that owner and admin can use to get all the assessment of a school in a session.',
  })
  @ApiResponse({
    status: 200,
    description: 'Assessments fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch assessments.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async getAllSchoolAssessmentsPerSession(
    @CurrentSchool() school: SchoolDocument,
    @CurrentSchoolMembership()
    membership: SchoolMembershipDocument,
    @Query() query: QueryAssessmentsDto,
  ) {
    const response =
      await this.schoolAssessmentsService.getAllSchoolAssessmentsPerSession(
        school._id.toString(),
        query,
      );

    return response;
  }
  @Get(
    'get-all-assessments-of-class-subject-in-a-session/:academicSessionId/:classId/:subjectId',
  )
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
  @SuccessMessage('Subject Assessments fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get school assessments in a session',
    description:
      'This is the endpoint that student, subject teacher, owner and admin can use to get all the class subject assessment of a school in a session.',
  })
  @ApiResponse({
    status: 200,
    description: 'Subject Assessments fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch assessments.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async getAllClassSubjectAssessmentsPerSession(
    @Param('academicSessionId') academicSessionId: string,
    @Param('subjectId') subjectId: string,
    @Param('classId') classId: string,
    @CurrentSchool() school: SchoolDocument,
    @CurrentSchoolMembership()
    membership: SchoolMembershipDocument,
    @Query() query: QueryWithPaginationDto,
  ) {
    const response =
      await this.schoolAssessmentsService.getAllClassSubjectAssessmentsPerSession(
        academicSessionId,
        subjectId,
        classId,
        school._id.toString(),
        query,
        membership,
      );

    return response;
  }

  @Get(
    'get-assessment-by-assessmentId-classId-academicSessionId/:academicSessionId/:classId/:assessmentId',
  )
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
  @SuccessMessage('Subject Assessment fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get an assessment by ID in a session',
    description:
      'This is the endpoint that student, subject teacher, owner and admin can use to Get an assessment by ID in a session.',
  })
  @ApiResponse({
    status: 200,
    description: 'Subject Assessment fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch assessment.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async getAssessmentByAssessmentId(
    @CurrentSchool() school: SchoolDocument,
    @Param('academicSessionId') academicSessionId: string,
    @Param('assessmentId') assessmentId: string,
    @Param('classId') classId: string,
    @CurrentSchoolMembership()
    membership: SchoolMembershipDocument,
  ) {
    const response =
      await this.schoolAssessmentsService.getAssessmentByAssessmentId(
        school._id.toString(),
        assessmentId,
        membership,
        academicSessionId,
        classId,
      );

    return response;
  }

  @Patch('update-assessment-status/:assessmentId')
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
  @SuccessMessage('Assessment archived successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Archive an assessment',
    description:
      'This is the endpoint that owner and admin can use to Archive an assessment.',
  })
  @ApiResponse({
    status: 200,
    description: 'Assessment archived successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to archive assessment.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async updateAssessmentStatus(
    @CurrentSchool() school: SchoolDocument,
    @Param('assessmentId') assessmentId: string,
    @Body() dto: UpdateAssessmentStatusDto,
  ) {
    const response = await this.schoolAssessmentsService.updateAssessmentStatus(
      school._id.toString(),
      assessmentId,
      dto,
    );

    return response;
  }

  @Get('start-assessment/:academicSessionId/:classId/:assessmentId')
  @UseGuards(
    JwtAuthGuard,
    DeviceSessionGuard,
    RolesGuard,
    SchoolMembershipGuard,
    SchoolRolesGuard,
  )
  @Roles(Role.USER)
  @SchoolRoles(SchoolRole.STUDENT)
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
  @SuccessMessage('Assessment started successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Start assessment in a session',
    description:
      'This is the endpoint that student is going to use to start an assessment.',
  })
  @ApiResponse({
    status: 200,
    description: 'Assessment started successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to start assessment.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async startAssessmentByAssessmentId(
    @CurrentSchool() school: SchoolDocument,
    @Param('academicSessionId') academicSessionId: string,
    @Param('assessmentId') assessmentId: string,
    @Param('classId') classId: string,
    @CurrentSchoolMembership()
    membership: SchoolMembershipDocument,
  ) {
    const response =
      await this.schoolAssessmentsService.startAssessmentByAssessmentId(
        school._id.toString(),
        assessmentId,
        membership,
        academicSessionId,
        classId,
      );

    return response;
  }
}

/*
{
        "questionId": "6afefb3ae8c342fe6222b13d",
        "questionType": "SINGLE_CHOICE",
        "questionText": "Choose the word nearest in meaning to 'abundant'.",
        "questionImages": [],
        "options": [
          {
            "key": "A",
            "text": "Scarce"
          },
          {
            "key": "B",
            "text": "Plentiful"
          },
          {
            "key": "C",
            "text": "Limited"
          },
          {
            "key": "D",
            "text": "Insufficient"
          }
        ],
        "marks": 5
      },




  classId: "6af43da9718344bf7ca92e3e"
  teacherId: "6af43ebad06e76c3a1c10053"
  "teacher email": "gbolagade@gmail.com",
  "owner email": "omoklazik@gmail.com",
  "student email": "omotolaade@gmail.com",
academicSessionId: "6af1af312933e3bc003b75d2"
subjectId: "6af43a3cdb43ea8761d9f4bd"
schoolId: "6aec47e4a964ddbb9b0beec9"

  owner:
  teacher:
  student: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2YWYyOTVkM2M3NThjYjFlODZhN2U2NWIiLCJlbWFpbCI6Im9tb3RvbGFhZGVAZ21haWwuY29tIiwicm9sZSI6IlVTRVIiLCJwbGFucyI6W10sImlhdCI6MTc5NTE2OTg1NSwiZXhwIjoxNzk1NDI5MDU1fQ.bF6UIGrBgM8_nWW0SubK0AdssRiX16sSPzntnRRavB8

  derock teacher: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2YWYwOWFiNjA5OGNlZWZhNmJkNjJmMmUiLCJlbWFpbCI6InRlYWNoZXJAZ21haWwuY29tIiwicm9sZSI6IlVTRVIiLCJwbGFucyI6W10sImlhdCI6MTc5NTA5NDE1NiwiZXhwIjoxNzk1MzUzMzU2fQ.v5K5t_teiMOOpvth2eNPHmOIN4_sQo5R-tUo7drI3xQ
  derock academic session: "6af2f6e79771f4ae990af95d"
{
            "class": "6af6f9c0e62edaf99481e5f0",
            "subject": "6af6d56c8d7f15e2a8e5a6a0"
          },
          {
            "class": "6af45f5f6c7db333f2c53848",
            "subject": "6af6d56c8d7f15e2a8e5a6a0"
          },
          {
            "class": "6af45f5f6c7db333f2c53848",
            "subject": "6af20b19965ab1a1d1601b6e"
          }
  */
