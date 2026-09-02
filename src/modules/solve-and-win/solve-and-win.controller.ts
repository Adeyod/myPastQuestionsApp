import {
  Body,
  Controller,
  Delete,
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
import { Roles } from '../../common/decorators/roles.decorator';
import { SuccessMessage } from '../../common/decorators/success-message.decorator';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { QueryWithPaginationDto } from '../../common/dto/query-with-pagination';
import { DeviceSessionGuard } from '../../common/guards/device-session.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '../users/schemas/user.schema';
import { AddQuestionsToContestSubjectDto } from './dtos/add-questions-to-contest-subject.dto';
import { AddQuestionsToContestDto } from './dtos/add-questions-to-contest.dto';
import { AddSubjectsToContestDto } from './dtos/add-subjects-to-contest.dto';
import { CreateSolveAndWinContestDto } from './dtos/create-contest.dto';
import { RemoveQuestionsFromContestDto } from './dtos/remove-questions-from-contest.dto';
import { RemoveSubjectsFromContestDto } from './dtos/remove-subjects-from-contest.dto';
import { UpdateSolveAndWinContestDto } from './dtos/update-contest.dto';
import { SolveAndWinService } from './solve-and-win.service';

@Controller('solve-and-win/contests')
export class SolveAndWinController {
  constructor(private readonly solveAndWinService: SolveAndWinService) {}

  @Post('create-contest')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: 'device-123456789',
  })
  @SuccessMessage('Solve and win contest created successfully.')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Admin create solve and win contest.',
    description:
      'This is the endpoint that admin is going to be using to create solve and win contest.',
  })
  @ApiResponse({
    status: 200,
    description: 'Solve and win contest created successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to create solve and win contest.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async createContest(@Body() createContestDto: CreateSolveAndWinContestDto) {
    const response =
      await this.solveAndWinService.createSolveAndWinContest(createContestDto);

    return response;
  }

  @Get('get-all-contests')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard, RolesGuard)
  @Roles(Role.USER, Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: 'device-123456789',
  })
  @SuccessMessage('Solve and win contests fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all solve and win contests.',
    description:
      'This is the endpoint that is going to be used to get all solve and win contests.',
  })
  @ApiResponse({
    status: 200,
    description: 'Solve and win contests fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch solve and win contests.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async findAllSolveAndWinContests(@Query() dto: QueryWithPaginationDto) {
    const response =
      await this.solveAndWinService.findAllSolveAndWinContests(dto);

    return response;
  }
  @Get('get-all-active-contests')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard, RolesGuard)
  @Roles(Role.USER, Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: 'device-123456789',
  })
  @SuccessMessage('Active Solve and win contests fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all active solve and win contests.',
    description:
      'This is the endpoint that is going to be used to get all active solve and win contests.',
  })
  @ApiResponse({
    status: 200,
    description: 'Active Solve and win contests fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch active solve and win contests.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async findActiveContests() {
    const response = await this.solveAndWinService.findActiveContests();

    return response;
  }

  @Get('get-contest-with-subjects-by-id/:contestId')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard, RolesGuard)
  @Roles(Role.USER, Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: 'device-123456789',
  })
  @SuccessMessage('Solve and win contest fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get solve and win contest.',
    description:
      'This is the endpoint that is going to be used to get single solve and win contest and it is going to return also the subjects to be done in the solve and win contest.',
  })
  @ApiResponse({
    status: 200,
    description: 'Solve and win contest fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch solve and win contest.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async findSolveAndWinContestByIdWithSubjects(
    @Param('contestId') contestId: string,
  ) {
    const response =
      await this.solveAndWinService.findSolveAndWinContestByIdWithSubjects(
        contestId,
      );

    return response;
  }
  @Get('get-contest-by-id/:contestId')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard, RolesGuard)
  @Roles(Role.USER, Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: 'device-123456789',
  })
  @SuccessMessage('Solve and win contest fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get single solve and win contest.',
    description:
      'This is the endpoint that is going to be used to get single solve and win contest.',
  })
  @ApiResponse({
    status: 200,
    description: 'Solve and win contest fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch solve and win contest.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async findSolveAndWinContestById(@Param('contestId') contestId: string) {
    const response =
      await this.solveAndWinService.findSolveAndWinContestById(contestId);

    return response;
  }

  @Patch('update-contest-by-id/:contestId')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: 'device-123456789',
  })
  @SuccessMessage('Solve and win contest updated successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update solve and win contest.',
    description:
      'This is the endpoint that is going to be used to update solve and win contest by the admin.',
  })
  @ApiResponse({
    status: 200,
    description: 'Solve and win contest updated successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to update solve and win contest.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async updateSolveAndWinById(
    @Param('contestId') contestId: string,
    @Body() updateContestDto: UpdateSolveAndWinContestDto,
  ) {
    const response = await this.solveAndWinService.updateSolveAndWinById(
      contestId,
      updateContestDto,
    );

    return response;
  }

  @Delete('cancel-contest-by-id/:contestId')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: 'device-123456789',
  })
  @SuccessMessage('Solve and win contest cancelled successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel solve and win contest.',
    description:
      'This is the endpoint that is going to be used to cancel a solve and win contest.',
  })
  @ApiResponse({
    status: 200,
    description: 'Solve and win contest cancelled successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to cancel solve and win contest.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async cancelContest(@Param('contestId') contestId: string) {
    const response = await this.solveAndWinService.cancelContest(contestId);

    return response;
  }
  @Delete('delete-contest-by-id/:contestId')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: 'device-123456789',
  })
  @SuccessMessage('Solve and win contest deleted successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete solve and win contest.',
    description:
      'This is the endpoint that is going to be used to delete a solve and win contest.',
  })
  @ApiResponse({
    status: 200,
    description: 'Solve and win contest deleted successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to delete solve and win contest.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async deleteContest(@Param('contestId') contestId: string) {
    const response = await this.solveAndWinService.deleteContest(contestId);

    return response;
  }

  @Patch('add-subjects-to-contest/:contestId')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: 'device-123456789',
  })
  @SuccessMessage('Subjects added to solve and win contest successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all solve and win contests.',
    description:
      'This is the endpoint that is going to be used to add subjects to a solve and win contest.',
  })
  @ApiResponse({
    status: 200,
    description: 'Subjects added to solve and win contest successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request. Unable to add subjects to solve and win contest.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async addSubjectsToContest(
    @Param('contestId') contestId: string,
    @Body() dto: AddSubjectsToContestDto,
  ) {
    const response = await this.solveAndWinService.addSubjectsToContest(
      contestId,
      dto,
    );

    return response;
  }

  @Patch('remove-subjects-from-contest/:contestId')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard, RolesGuard)
  @Roles(Role.USER, Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: 'device-123456789',
  })
  @SuccessMessage('Subjects removed from solve and win contest successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all solve and win contests.',
    description:
      'This is the endpoint that is going to be used to remove subjects from a solve and win contest.',
  })
  @ApiResponse({
    status: 200,
    description: 'Subjects removed from solve and win contest successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request. Unable to remove subjects from a solve and win contest.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async removeSubjectsFromContest(
    @Param('contestId') contestId: string,
    @Body() dto: RemoveSubjectsFromContestDto,
  ) {
    const response = await this.solveAndWinService.removeSubjectsFromContest(
      contestId,
      dto,
    );

    return response;
  }
  @Patch('add-questions-to-subject-in-contest/:contestId/:subjectId')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: '394ir-84736e5362-yw7qy3i38',
  })
  @SuccessMessage('Questions added to solve and win contest successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Create questions and add questions IDs to a solve and win contest.',
    description:
      'This is the endpoint that is going to be used to add questions to a solve and win contest.',
  })
  @ApiResponse({
    status: 200,
    description: 'Questions added to solve and win contest successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request. Unable to add questions to a solve and win contest.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async createQuestionsForASubjectInContest(
    @Param('contestId') contestId: string,
    @Param('subjectId') subjectId: string,
    @Body() dto: AddQuestionsToContestSubjectDto,
  ) {
    const response =
      await this.solveAndWinService.createQuestionsForASubjectInContest(
        contestId,
        subjectId,
        dto,
      );

    return response;
  }
  @Patch('add-questions-to-contest/:contestId')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: 'device-123456789',
  })
  @SuccessMessage('Questions added to solve and win contest successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Add questions to a solve and win contest.',
    description:
      'This is the endpoint that is going to be used to add questions to a solve and win contest.',
  })
  @ApiResponse({
    status: 200,
    description: 'Questions added to solve and win contest successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request. Unable to add questions to a solve and win contest.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async addQuestionsToContest(
    @Param('contestId') contestId: string,
    @Body() dto: AddQuestionsToContestDto,
  ) {
    const response = await this.solveAndWinService.addQuestionsToContest(
      contestId,
      dto,
    );

    return response;
  }
  @Patch('remove-questions-from-contest/:contestId')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: 'device-123456789',
  })
  @SuccessMessage(
    'Questions removed from a solve and win contest successfully.',
  )
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove questions from a solve and win contest.',
    description:
      'This is the endpoint that is going to be used to remove questions from a solve and win contest.',
  })
  @ApiResponse({
    status: 200,
    description: 'Questions removed from a solve and win contest successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request. Unable to remove questions from a solve and win contest.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async removeQuestionsFromContest(
    @Param('contestId') contestId: string,
    @Body() dto: RemoveQuestionsFromContestDto,
  ) {
    const response = await this.solveAndWinService.removeQuestionsFromContest(
      contestId,
      dto,
    );

    return response;
  }

  @Patch('activate-contest/:contestId')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: 'device-123456789',
  })
  @SuccessMessage('Solve and win contest activated successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Activate a solve and win contest.',
    description:
      'This is the endpoint that is going to be used to activate a solve and win contest.',
  })
  @ApiResponse({
    status: 200,
    description: 'Solve and win contest activated successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to activate a solve and win contest.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async activateContest(@Param('contestId') contestId: string) {
    const response = await this.solveAndWinService.activateContest(contestId);

    return response;
  }
}
