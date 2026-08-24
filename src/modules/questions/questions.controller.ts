import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { GetCurrentUser } from '../../common/decorators/get-current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { SuccessMessage } from '../../common/decorators/success-message.decorator';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { DeviceSessionGuard } from '../../common/guards/device-session.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PlansGuard } from '../../common/guards/plans.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { JwtUser } from '../../common/types/jwt-user.type';
import { Role } from '../users/schemas/user.schema';
import { GetPracticeQuestionsDto } from './dto/get-practice-questions.dto';
import { GetQuestionsDto } from './dto/get-questions.dto';
import { QuestionsService } from './questions.service';

@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get('get-question-by-id/:questionId')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard)
  @SuccessMessage('Question fetched successfully.')
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: 'device-123456789',
  })
  @ApiOperation({
    summary: 'This is the endpoint for fetching a question by the questionId',
    description:
      'This endpoint respond with a particular question which its ID is passed as a param. There is no role restriction yet on the endpoint.',
  })
  @ApiResponse({
    status: 200,
    description: 'Question fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch question',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getQuestionById(@Param('questionId') questionId: string) {
    return await this.questionsService.findById(questionId);
  }

  @Get('count-questions-by-subjectId/:subjectId')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: 'device-123456789',
  })
  @ApiOperation({
    summary:
      'This gives response as to the number of questions we have for a subject',
    description:
      'Get question summary for a given subject. Admin and user can use this endpoint.',
  })
  @ApiResponse({
    status: 200,
    description: 'Question summary fetched successfully for this subject.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request. Unable to fetch question summary for this subject.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async countQuestionsBySubjectId(@Param('subjectId') subjectId: string) {
    return await this.questionsService.countQuestionsBySubjectId(subjectId);
  }

  @Get('count-questions-by-subjectId-and-year/:subjectId/:year')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: 'device-123456789',
  })
  @SuccessMessage(
    'Question summary fetched successfully for this subject for the year.',
  )
  @ApiOperation({
    summary: 'Get question summary for a given year',
    description:
      'This gives response as to the number of questions we have for a given year for a subject. Admin and user can use this endpoint.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Question summary fetched successfully for this subject for the year.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request. Unable to fetch question summary for this subject.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async countQuestionsBySubjectIdAndYear(
    @Param('subjectId') subjectId: string,
    @Param('year') year: string,
  ) {
    return await this.questionsService.countQuestionsBySubjectIdAndYear(
      subjectId,
      year,
    );
  }

  @Get('summary')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: 'device-123456789',
  })
  @SuccessMessage('Question summary data fetched successfully')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fetching question summary',
    description:
      'This is the endpoint for fetching summary of all the questions inside the database. This endpoint is expecting accessToken from req.headers. This endpoint is admin.',
  })
  @ApiResponse({
    status: 200,
    description: 'Question summary fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch questions summary',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async getQuestionsSummary() {
    return await this.questionsService.getQuestionsSummary();
  }

  @Get('free-questions-per-plan')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard, RolesGuard)
  @Roles(Role.USER, Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: 'device-123456789',
  })
  @SuccessMessage('Questions fetched successfully')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fetching free past questions based on selected plan',
    description:
      'This is the endpoint for fetching past questions of free years based on the plan that the user selected. This endpoint is expecting plan, subject, year, examType from req.query. It is also expecting accessToken from req.headers. Admin and user can use this endpoint.',
  })
  @ApiResponse({
    status: 200,
    description: 'Questions fetched successfully',
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
  async getFreeQuestionsPerPlan(@Query() getQuestionsDto: GetQuestionsDto) {
    return await this.questionsService.getFreeQuestionsPerPlan(getQuestionsDto);
  }
  @Get('paid-questions-per-plan')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard, RolesGuard, PlansGuard)
  @Roles(Role.USER, Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: 'device-123456789',
  })
  @SuccessMessage('Questions fetched successfully')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fetching free past questions based on selected plan',
    description:
      'This is the endpoint for fetching past questions of paid years based on the plan that the user selected. This endpoint is expecting plan, subject, year, examType from req.query. It is also expecting accessToken from req.headers. Admin and user can use this endpoint.',
  })
  @ApiResponse({
    status: 200,
    description: 'Questions fetched successfully',
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
  async getPaidQuestionsPerPlan(@Query() getQuestionsDto: GetQuestionsDto) {
    const questions =
      await this.questionsService.getPaidQuestionsPerPlan(getQuestionsDto);
    return questions;
  }

  @Get('practice-session')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard, RolesGuard)
  @Roles(Role.USER, Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: 'device-123456789',
  })
  @SuccessMessage('Questions fetched successfully')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fetching practice questions based on selected plan',
    description:
      'This is the endpoint for fetching practice questions based on the plan that the user selected. This endpoint is expecting subjectId, mode, questionCount and duration from req.body. It is also expecting accessToken from req.headers. Admin and user can use this endpoint.',
  })
  @ApiResponse({
    status: 200,
    description: 'Questions fetched successfully',
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
  async getPracticeQuestionBySubjectId(
    @Query() getPracticeQuestionsDto: GetPracticeQuestionsDto,
    @GetCurrentUser() user: JwtUser,
  ) {
    const response = await this.questionsService.getPracticeQuestionBySubjectId(
      getPracticeQuestionsDto,
      user,
    );

    return response;
  }
}
