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
import { GetCurrentUser } from '../../common/decorators/get-current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { SuccessMessage } from '../../common/decorators/success-message.decorator';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { QueryWithPaginationDto } from '../../common/dto/query-with-pagination';
import { DeviceSessionGuard } from '../../common/guards/device-session.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { JwtUser } from '../../common/types/jwt-user.type';
import { Role } from '../users/schemas/user.schema';
import { CreateQuizDto } from './dtos/create-quiz.dto';
import { GetRoundQuestionDto } from './dtos/get-round-question.dto';
import { QuizGateway } from './quiz.gateway';
import { QuizService } from './quiz.service';

@Controller('quiz')
export class QuizController {
  constructor(
    private readonly quizService: QuizService,
    private readonly quizGateway: QuizGateway,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, DeviceSessionGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: '394ir-84736e5362-yw7qy3i38',
  })
  @SuccessMessage('Quiz created successfully')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Creation of quiz',
    description: 'This is the endpoint for creating quiz.',
  })
  @ApiResponse({
    status: 200,
    description: 'Quiz created successfully',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to create quiz.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async createQuiz(@Body() createQuizDto: CreateQuizDto) {
    return this.quizService.createQuiz(createQuizDto);
  }

  @Get('get-all-quizzes')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: '394ir-84736e5362-yw7qy3i38',
  })
  @SuccessMessage('Quizzes fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all quizzes.',
    description:
      'This is the endpoint that is going to be used to get all quizzes.',
  })
  @ApiResponse({
    status: 200,
    description: 'Quizzes fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch quizzes.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async findAllQuizzes(@Query() dto: QueryWithPaginationDto) {
    const response = await this.quizService.findAllQuizzes(dto);

    return response;
  }
  @Get('get-quiz-by-quizId/:quizId')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: '394ir-84736e5362-yw7qy3i38',
  })
  @SuccessMessage('Quiz fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all quizzes.',
    description:
      'This is the endpoint that is going to be used to get quiz details.',
  })
  @ApiResponse({
    status: 200,
    description: 'Quiz fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch quiz.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async findQuizById(@Param('quizId') quizId: string) {
    const response = await this.quizService.findQuizById(quizId);

    return response;
  }
  @Get('get-all-my-quizzes/:userId')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard, RolesGuard)
  @Roles(Role.USER)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: '394ir-84736e5362-yw7qy3i38',
  })
  @SuccessMessage('Quizzes fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all my quizzes.',
    description:
      'This is the endpoint that is going to be used to get all quizzes of logged in.',
  })
  @ApiResponse({
    status: 200,
    description: 'Quizzes fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch quizzes.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async findAllMyQuizzes(
    @Query() dto: QueryWithPaginationDto,
    @Param('userId') userId: string,
    @GetCurrentUser() user: JwtUser,
  ) {
    const response = await this.quizService.findAllMyQuizzes(user, userId, dto);

    return response;
  }
  @Get('get-round-questions/:quizId')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: '394ir-84736e5362-yw7qy3i38',
  })
  @SuccessMessage('Quiz round questions fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get round quiz questions.',
    description:
      'This is the endpoint that is going to be used to get quiz round questions.',
  })
  @ApiResponse({
    status: 200,
    description: 'Quiz round questions fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch quiz round questions.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async getRoundQuestions(
    @Param('quizId') quizId: string,
    @Body() dto: GetRoundQuestionDto,
    @GetCurrentUser() user: JwtUser,
  ) {
    const response = await this.quizService.getRoundQuestions(
      quizId,
      dto.roundNumber,
    );

    return response;
  }

  @Post('create-room')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: '394ir-84736e5362-yw7qy3i38',
  })
  @SuccessMessage('Quiz room created successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create quiz room.',
    description:
      'This is the endpoint that is going to be used to create quiz room.',
  })
  @ApiResponse({
    status: 200,
    description: 'Quiz room created successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to create quiz room.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async createMeetingRoom(
    @Body('quizId') quizId: string,
    @GetCurrentUser() user: JwtUser,
  ) {
    const result = await this.quizService.createMeetingRoom(quizId, user);

    // 2. Emit WS notification so frontend participants listening on /quiz namespace get room code
    this.quizGateway.server.emit('room_ready_to_join', {
      quizId,
      roomId: result.roomId,
    });

    return {
      success: true,
      message: 'Room created successfully.',
      data: result,
    };
  }

  @Post('join-quiz-by-id/:quizId')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard, RolesGuard)
  @Roles(Role.USER)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: '394ir-84736e5362-yw7qy3i38',
  })
  @SuccessMessage('User joined quiz successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Join quiz.',
    description: 'This is the endpoint that user is going to use to join quiz.',
  })
  @ApiResponse({
    status: 200,
    description: 'User joined quiz successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to join quiz.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async joinQuizById(
    @Param('quizId') quizId: string,
    @GetCurrentUser() user: JwtUser,
  ) {
    const response = await this.quizService.joinQuizById(user, quizId);

    return response;
  }
}
