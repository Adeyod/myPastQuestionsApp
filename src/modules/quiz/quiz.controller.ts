import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { Types } from 'mongoose';
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
  @Get('get-all-waiting-quizzes-user-has-not-joined/:userId')
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
    summary: 'Get all quizzes.',
    description:
      'This is the endpoint that logged in user is going to use to get all quizzes that he has not joined.',
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
  async findAllWaitingQuizzesLoggedInUserHasNotJoined(
    @Query() dto: QueryWithPaginationDto,
    @Param('userId') userId: string,
    @GetCurrentUser() user: JwtUser,
  ) {
    const response =
      await this.quizService.findAllWaitingQuizzesLoggedInUserHasNotJoined(
        user,
        userId,
        dto,
      );

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
  @Get('get-round-questions/:quizId/:roomId')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: '394ir-84736e5362-yw7qy3i38',
  })
  @ApiQuery({
    name: 'roundNumber',
    type: Number,
    required: true,
    description: 'The sequence number of the quiz round',
    example: 1,
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
    @Param('roomId') roomId: string,
    @Query('roundNumber', ParseIntPipe) roundNumber: number,
    @GetCurrentUser() user: JwtUser,
  ) {
    const response = await this.quizService.getRoundQuestions(
      quizId,
      roundNumber,
    );

    const output = {
      event: 'getting_room_questions_ack',
      data: {
        message: 'Quiz round questions fetched successfully.',
        questions: response,
        roomId: roomId,
        quizId: quizId,
        roundNumber: roundNumber,
      },
    };

    return output;
  }

  @Post('create-room/:quizId')
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
    @Param('quizId') quizId: string,
    @GetCurrentUser() user: JwtUser,
  ) {
    const result = await this.quizService.createMeetingRoom(quizId, user);

    // 2. Emit WS notification so frontend participants listening on /quiz namespace get room code
    // this.quizGateway.server.emit('room_ready_to_join', {
    //   quizId,
    //   roomId: result.roomId,
    // });

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
  @Post('activate-room/:roomId')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: '394ir-84736e5362-yw7qy3i38',
  })
  @SuccessMessage('Quiz room activated successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Activate quiz room.',
    description:
      'This is the endpoint that admin is going to use to activate quiz room.',
  })
  @ApiResponse({
    status: 200,
    description: 'Quiz room activated successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to activate quiz room.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async activateRoom(
    @Param('roomId') roomId: string,
    @GetCurrentUser() user: JwtUser,
  ) {
    const response = await this.quizService.activateRoom(
      roomId,
      user.sub.toString(),
    );

    return response;
  }
  // @Post('display-next-question/:quizId/:roomId')
  // @UseGuards(JwtAuthGuard, DeviceSessionGuard, RolesGuard)
  // @Roles(Role.ADMIN)
  // @ApiBearerAuth('JWT-auth')
  // @ApiHeader({
  //   name: 'x-device-id',
  //   description: 'Unique device identifier for the user session',
  //   required: true,
  //   example: '394ir-84736e5362-yw7qy3i38',
  // })
  // @SuccessMessage('Quiz round questions fetched successfully.')
  // @HttpCode(HttpStatus.OK)
  // @ApiOperation({
  //   summary: 'Get room questions.',
  //   description:
  //     'This is the endpoint that admin is going to use to get room round questions.',
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Quiz round questions fetched successfully.',
  //   type: ApiResponseDto,
  // })
  // @ApiResponse({
  //   status: 400,
  //   description: 'Bad request. Unable to fetch quiz round questions.',
  // })
  // @ApiResponse({
  //   status: 500,
  //   description: 'Internal server error',
  // })
  // @ApiResponse({
  //   status: 429,
  //   description: 'Too many requests. Rate limit exceeded',
  // })
  // async getActiveQuestion(
  //   @Param('quizId') quizId: string,
  //   @Param('roomId') roomId: string,
  //   @Body() activeQuestionDto: ActiveQuestionDto,
  //   @GetCurrentUser() user: JwtUser,
  // ) {
  //   const response = await this.quizService.activateRoom(
  //     roomId,
  //     user.sub.toString(),
  //   );

  //   return response;
  // }

  @Post('participant-selected-answer/:roomId/:questionId/:selectedAnswerId')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard, RolesGuard)
  @Roles(Role.USER)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: '394ir-84736e5362-yw7qy3i38',
  })
  @SuccessMessage('Question answer submitted successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get room questions.',
    description:
      'This is the endpoint that participant is going to use to submit answer to a question.',
  })
  @ApiResponse({
    status: 200,
    description: 'Question answer submitted successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to question answer.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async submitAnswer(
    @Param('roomId') roomId: string,
    @Param('questionId') questionId: string,
    @Param('selectedAnswerId') selectedAnswerId: string,
    @Query('roundNumber', ParseIntPipe) roundNumber: number,
    @GetCurrentUser() user: JwtUser,
  ) {
    const response = await this.quizService.submitAnswer(
      roomId,
      user.sub.toString(),
      roundNumber,
      questionId,
      selectedAnswerId,
    );

    // I need to handle the broadcasting of the person that got the correct answer.

    return response;
  }

  @Get('get-question-fastest-winner/:quizId/:roomId/:questionId')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard, RolesGuard)
  @Roles(Role.USER, Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: '394ir-84736e5362-yw7qy3i38',
  })
  @SuccessMessage('Question fastest winner fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get question fastest winner.',
    description:
      'This is the endpoint that is going to be used to fetch question fastest winner',
  })
  @ApiResponse({
    status: 200,
    description: 'Question fastest winner fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch question fastest winner.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async getFastestCorrectParticipant(
    @Param('quizId') quizId: string,
    @Param('roomId') roomId: string,
    @Param('questionId') questionId: string,
    @GetCurrentUser() user: JwtUser,
  ) {
    const response = await this.quizService.getFastestCorrectParticipant(
      quizId,
      roomId,
      questionId,
    );

    return {
      event: 'get_question_fastest_winner_ack',
      data: {
        quizId: quizId,
        roomId: roomId,
        winner: response,
      },
    };
  }

  @Get('get-room-document/:roomId')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: '394ir-84736e5362-yw7qy3i38',
  })
  @SuccessMessage('Room document fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get room document.',
    description: 'This is the endpoint for fetching room document.',
  })
  @ApiResponse({
    status: 200,
    description: 'Room document fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch room document.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async getRoomDocumentForAdmin(
    @Param('roomId') roomId: string,
    @GetCurrentUser() user: JwtUser,
  ) {
    const response = await this.quizService.getRoomDocumentForAdmin(
      roomId,
      new Types.ObjectId(user.sub.toString()),
    );

    return {
      event: 'get_room_ack',
      data: response,
    };
  }

  @Get('get-quiz-room-leaderboard/:quizId/:roomId')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: '394ir-84736e5362-yw7qy3i38',
  })
  @SuccessMessage('Quiz Room leaderboard fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get room leaderboard.',
    description: 'This is the endpoint for fetching room leaderboard.',
  })
  @ApiResponse({
    status: 200,
    description: 'Quiz Room leaderboard fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch quiz room leaderboard.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async getQuizRoomLeaderboard(
    @Param('quizId') quizId: string,
    @Query('roundNumber', ParseIntPipe) roundNumber: number,
    @GetCurrentUser() user: JwtUser,
  ) {
    const response = await this.quizService.getQuizRoomLeaderboard(
      quizId,
      roundNumber,
    );

    return {
      event: 'get_quiz_room_leaderboard_ack',
      data: response,
    };
  }
}
