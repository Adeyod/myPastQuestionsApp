import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SuccessMessage } from '../../common/decorators/success-message.decorator';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { QuestionInjectionDto } from './dto/question-injection.dto';
import { QuestionsInjectionService } from './questions-injection.service';

@Controller('questions-injection')
export class QuestionsInjectionController {
  constructor(
    private readonly questionsInjectionService: QuestionsInjectionService,
  ) {}

  @Get('inject/:accessUser')
  async injectQuestions(@Param('accessUser') accessUser: string) {
    await this.questionsInjectionService.addSyncJob({ accessUser });
    return { message: 'Injection started in background' };
  }

  @Post('/inject-manually')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(Role.ADMIN)
  // @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Questions stored successfully.')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'This is the endpoint for adding questions into the database.',
    description:
      'This is the endpoint for creating questions. This endpoint add past questions into the database. This endpoint is expecting accessToken from req.headers. It is also expecting all the values from the DTO. This endpoint can only be accessed by admins.',
  })
  @ApiResponse({
    status: 201,
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
  async addQuestionManually(
    @Body() questionInjectionDto: QuestionInjectionDto,
  ) {
    // console.log('controller questionInjectionDto:', questionInjectionDto);
    return await this.questionsInjectionService.addQuestionManually(
      questionInjectionDto,
    );
  }
}
