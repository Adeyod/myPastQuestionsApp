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

import type { SchoolMembershipDocument } from '../school-memberships/schemas/school-membership.schema';
import { SchoolRole } from '../school-memberships/schemas/school-membership.schema';
import type { SchoolDocument } from '../schools/schemas/schools.schema';
import { Role } from '../users/schemas/user.schema';

import { QueryWithPaginationDto } from '../../common/dto/query-with-pagination';
import { SubmitAssessmentAttemptDto } from './dtos/submit-assessment-attempt.dto';
import { UpdateAssessmentAnswersDto } from './dtos/update-assessment-answers.dto';
import { SchoolAssessmentAttemptsService } from './school-assessment-attempts.service';

@Controller('school-assessment-attempts')
export class SchoolAssessmentAttemptsController {
  constructor(
    private readonly attemptsService: SchoolAssessmentAttemptsService,
  ) {}

  @Patch(':attemptId/answers')
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
    description: 'Unique device identifier for the user session.',
    required: true,
    example: '394ir-84736e5362-yw7qy3i38',
  })
  @SuccessMessage('Assessment answers saved successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Save or update assessment answers',
    description:
      'Allows a student to save or change answers in an active assessment attempt.',
  })
  @ApiResponse({
    status: 200,
    description: 'Assessment answers saved successfully.',
    type: ApiResponseDto,
  })
  async updateAssessmentAnswers(
    @Param('attemptId') attemptId: string,
    @Body() dto: UpdateAssessmentAnswersDto,
    @CurrentSchool() school: SchoolDocument,
    @CurrentSchoolMembership()
    membership: SchoolMembershipDocument,
  ) {
    const response = await this.attemptsService.updateAssessmentAnswers(
      school._id.toString(),
      attemptId,
      membership._id.toString(),
      dto,
    );

    return response;
  }

  @Post(':attemptId/submit')
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
    description: 'Unique device identifier for the user session.',
    required: true,
    example: '394ir-84736e5362-yw7qy3i38',
  })
  @SuccessMessage('Assessment submitted successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Submit an assessment attempt',
    description:
      "Submits the student's assessment attempt and triggers automatic marking or manual marking.",
  })
  @ApiResponse({
    status: 200,
    description: 'Assessment submitted successfully.',
    type: ApiResponseDto,
  })
  async submitAssessmentAttempt(
    @Param('attemptId') attemptId: string,
    @Body() dto: SubmitAssessmentAttemptDto,
    @CurrentSchool() school: SchoolDocument,
    @CurrentSchoolMembership()
    membership: SchoolMembershipDocument,
  ) {
    const response = await this.attemptsService.submitAssessmentAttempt(
      school._id.toString(),
      attemptId,
      membership._id.toString(),
      dto,
    );

    return response;
  }

  @Get(':attemptId')
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
    description: 'Unique device identifier for the user session.',
    required: true,
    example: '394ir-84736e5362-yw7qy3i38',
  })
  @SuccessMessage('Assessment attempt fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get an assessment attempt',
    description: 'Retrieves the authenticated student’s assessment attempt.',
  })
  @ApiResponse({
    status: 200,
    description: 'Assessment attempt fetched successfully.',
    type: ApiResponseDto,
  })
  async getAssessmentAttemptById(
    @Param('attemptId') attemptId: string,
    @CurrentSchool() school: SchoolDocument,
    @CurrentSchoolMembership()
    membership: SchoolMembershipDocument,
  ) {
    const response = await this.attemptsService.getAssessmentAttemptById(
      school._id.toString(),
      attemptId,
      membership._id.toString(),
    );

    return response;
  }

  @Get('get-my-session-assessment-attempts/:academicSessionId')
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
    description: 'Unique device identifier for the user session.',
    required: true,
    example: '394ir-84736e5362-yw7qy3i38',
  })
  @SuccessMessage('Assessment attempts fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get session assessment attempts',
    description:
      'Retrieves the authenticated student’s assessment attempts in a session.',
  })
  @ApiResponse({
    status: 200,
    description: 'Assessment attempts fetched successfully.',
    type: ApiResponseDto,
  })
  async getMySessionAssessmentAttemptByAcademicSessionId(
    @Param('academicSessionId') academicSessionId: string,
    @CurrentSchool() school: SchoolDocument,
    @CurrentSchoolMembership()
    membership: SchoolMembershipDocument,
    @Query() query: QueryWithPaginationDto,
  ) {
    const response =
      await this.attemptsService.getMySessionAssessmentAttemptByAcademicSessionId(
        school._id.toString(),
        academicSessionId,
        membership,
        query,
      );

    return response;
  }
}
