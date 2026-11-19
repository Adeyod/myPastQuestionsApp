import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentSchoolMembership } from '../../common/decorators/current-school-membership.decorator';
import { CurrentSchool } from '../../common/decorators/current-school.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { SchoolRoles } from '../../common/decorators/school-roles.decorator';
import { SuccessMessage } from '../../common/decorators/success-message.decorator';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { DeviceSessionGuard } from '../../common/guards/device-session.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SchoolMembershipGuard } from '../../common/guards/school-membership.guard';
import { SchoolRolesGuard } from '../../common/guards/school-roles.guard';
import {
  type SchoolMembershipDocument,
  SchoolRole,
} from '../school-memberships/schemas/school-membership.schema';
import { type SchoolDocument } from '../schools/schemas/schools.schema';
import { Role } from '../users/schemas/user.schema';
import { CreateSchoolQuestionsDto } from './dtos/create-question.dto';
import { UpdateSchoolQuestionStatusDto } from './dtos/update-question-status.dto';
import { SchoolQuestionsService } from './school-questions.service';

@ApiTags('School Questions Bank')
@Controller('school/question-bank')
export class SchoolQuestionsController {
  constructor(
    private readonly schoolQuestionsService: SchoolQuestionsService,
  ) {}

  @Post('create-questions/:academicSessionId')
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
  @SuccessMessage('Questions stored successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Store multiple questions in the school question bank',
    description:
      'Store multiple questions in the school question bank. For subject teacher.',
  })
  @ApiResponse({
    status: 200,
    description: 'Questions stored successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to store questions.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async createQuestions(
    @CurrentSchool() school: SchoolDocument,
    @Param('academicSessionId') academicSessionId: string,
    @CurrentSchoolMembership()
    membership: SchoolMembershipDocument,
    @Body() createSchoolQuestionsDto: CreateSchoolQuestionsDto,
  ) {
    const response = await this.schoolQuestionsService.createQuestions(
      school._id.toString(),
      membership._id.toString(),
      academicSessionId,
      createSchoolQuestionsDto,
    );

    return response;
  }

  @Get(
    'get-questions-by-subjectId-classId-quantity/:academicSessionId/:subjectId/:classId/:quantity',
  )
  @UseGuards(
    JwtAuthGuard,
    DeviceSessionGuard,
    RolesGuard,
    SchoolMembershipGuard,
    SchoolRolesGuard,
  )
  @Roles(Role.USER)
  @SchoolRoles(SchoolRole.STUDENT, SchoolRole.TEACHER)
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
  @SuccessMessage('Questions fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Get questions in the school question bank using class ID, subject ID, acaddemic session ID and quantity(number of questions needed)',
    description:
      'Get questions in the school question bank using class ID, subject ID, acaddemic session ID and quantity(number of questions needed). For student practice.',
  })
  @ApiResponse({
    status: 200,
    description: 'Questions fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch questions.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async getSpecificNoOfSubjectQuestions(
    @CurrentSchool() school: SchoolDocument,
    @CurrentSchoolMembership() membership: SchoolMembershipDocument,
    @Param('academicSessionId') academicSessionId: string,
    @Param('subjectId') subjectId: string,
    @Param('classId') classId: string,
    @Param('quantity', ParseIntPipe) quantity: number,
  ) {
    const response =
      await this.schoolQuestionsService.getSpecificNoOfSubjectQuestions(
        school._id.toString(),
        membership._id.toString(),
        academicSessionId,
        subjectId,
        classId,
        quantity,
      );

    return response;
  }

  @Get('get-question/:academicSessionId/:classId/:subjectId/:questionId')
  @UseGuards(
    JwtAuthGuard,
    DeviceSessionGuard,
    RolesGuard,
    SchoolMembershipGuard,
    SchoolRolesGuard,
  )
  @Roles(Role.USER)
  @SchoolRoles(
    SchoolRole.STUDENT,
    SchoolRole.ADMIN,
    SchoolRole.OWNER,
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
  @SuccessMessage('Question fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get a question by ID',
    description: 'Get a question by ID.',
  })
  @ApiResponse({
    status: 200,
    description: 'Question fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch question.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async getQuestionById(
    @CurrentSchool() school: SchoolDocument,
    @Param('questionId') questionId: string,
    @CurrentSchoolMembership() membership: SchoolMembershipDocument,
    @Param('academicSessionId') academicSessionId: string,
    @Param('subjectId') subjectId: string,
    @Param('classId') classId: string,
  ) {
    const response = await this.schoolQuestionsService.getQuestionById(
      school._id.toString(),
      questionId,
      membership,
      academicSessionId,
      subjectId,
      classId,
    );

    return response;
  }

  @Patch('update-question-status/:questionId')
  @UseGuards(
    JwtAuthGuard,
    DeviceSessionGuard,
    RolesGuard,
    SchoolMembershipGuard,
    SchoolRolesGuard,
  )
  @Roles(Role.USER)
  @SchoolRoles(SchoolRole.ADMIN, SchoolRole.OWNER)
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
  @SuccessMessage('Question updated successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Activate or deactivate a question',
    description: 'Activate or deactivate a question.',
  })
  @ApiResponse({
    status: 200,
    description: 'Question updated successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to update question.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async updateQuestionStatus(
    @CurrentSchool() school: SchoolDocument,
    @Param('questionId') questionId: string,
    @Body() dto: UpdateSchoolQuestionStatusDto,
  ) {
    const response = await this.schoolQuestionsService.updateQuestionStatus(
      school._id.toString(),
      questionId,
      dto,
    );

    return response;
  }
}
