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
import { GetCurrentUser } from '../../../common/decorators/get-current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { SuccessMessage } from '../../../common/decorators/success-message.decorator';
import { ApiResponseDto } from '../../../common/dto/api-response.dto';
import { QueryWithPaginationDto } from '../../../common/dto/query-with-pagination';
import { DeviceSessionGuard } from '../../../common/guards/device-session.guard';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import type { JwtUser } from '../../../common/types/jwt-user.type';
import { Role } from '../../users/schemas/user.schema';
import { PracticeService } from '../services/practice.service';

@Controller('practice')
export class PracticeController {
  constructor(private readonly practiceService: PracticeService) {}
  @Get('get-user-practice-history/:userId')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard, RolesGuard)
  @Roles(Role.USER, Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: '394ir-84736e5362-yw7qy3i38',
  })
  @SuccessMessage('All practice history of this user fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all practice history for a user.',
    description:
      'This is the endpoint for fetching all the practice history of a user. This endpoint is expecting accessToken from req.headers and it is also expecting userId from req.params and it is expecting limit, pages, and searchParams from req.query.',
  })
  @ApiResponse({
    status: 200,
    description: "User's practice history fetched successfully.",
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch practice history.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async getPracticeHistoryForLoggedInUser(
    @Param('userId') userId: string,
    @Query() queryWithPaginationDto: QueryWithPaginationDto,
    @GetCurrentUser() user: JwtUser,
  ) {
    const response =
      await this.practiceService.getPracticeHistoryForLoggedInUser(
        user,
        userId,
        queryWithPaginationDto,
      );

    return response;
  }
  @Get('get-all-practice-history')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: '394ir-84736e5362-yw7qy3i38',
  })
  @SuccessMessage('All practice history fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all practice history on the platform.',
    description:
      'This is the endpoint for fetching all the practice history on the platform. This endpoint is expecting accessToken from req.headers and it is expecting limit, pages, and searchParams from req.query.',
  })
  @ApiResponse({
    status: 200,
    description: 'All practice history fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch practice history.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async getAllPracticeHistory(
    @Query() queryWithPaginationDto: QueryWithPaginationDto,
  ) {
    const response = await this.practiceService.getAllPracticeHistory(
      queryWithPaginationDto,
    );

    return response;
  }
  @Get('get-single-practice-history-by-history-id/:historyId')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard, RolesGuard)
  @Roles(Role.USER, Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: '394ir-84736e5362-yw7qy3i38',
  })
  @SuccessMessage('Single practice history fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get single practice history.',
    description:
      'This is the endpoint for fetching single practice history of a user. This endpoint is expecting accessToken from req.headers and it is also expecting historyId from req.params.',
  })
  @ApiResponse({
    status: 200,
    description: 'Single practice history fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch single practice history.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async getSinglePracticeHistory(
    @Param('historyId') historyId: string,
    @GetCurrentUser() user: JwtUser,
  ) {
    const response = await this.practiceService.getSinglePracticeHistory(
      user,
      historyId,
    );

    return response;
  }
}
