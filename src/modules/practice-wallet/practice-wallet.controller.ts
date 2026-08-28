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
import { QueryWithPaginationDto } from '../../common/dto/query-with-pagination';
import { DeviceSessionGuard } from '../../common/guards/device-session.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { JwtUser } from '../../common/types/jwt-user.type';
import { Role } from '../users/schemas/user.schema';
import { PracticeWalletService } from './practice-wallet.service';

@Controller('practice-wallet')
export class PracticeWalletController {
  constructor(private readonly practiceWalletService: PracticeWalletService) {}

  @Get('get-all-practice-wallets')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: '394ir-84736e5362-yw7qy3i38',
  })
  @SuccessMessage('Practice wallets fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get practice wallets.',
    description:
      'This is the endpoint for fetching all practice wallets. This endpoint is expecting accessToken from req.headers.',
  })
  @ApiResponse({
    status: 200,
    description: 'Practice wallets fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch practice wallets.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async getAllPracticeWallets(@Query() queryDto: QueryWithPaginationDto) {
    const response =
      await this.practiceWalletService.getAllPracticeWallets(queryDto);

    return response;
  }
  @Get('get-practice-wallet-by-practice-wallet-id/:practiceWalletId')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard, RolesGuard)
  @Roles(Role.USER, Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: '394ir-84736e5362-yw7qy3i38',
  })
  @SuccessMessage('Practice wallet fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get practice wallet by practice wallet ID.',
    description:
      'This is the endpoint for fetching practice wallet by practice wallet ID. This endpoint is expecting accessToken from req.headers and it is also expecting practiceWalletId from req.params.',
  })
  @ApiResponse({
    status: 200,
    description: 'Practice wallet fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch practice wallet.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async getPracticeWalletByPracticeWalletId(
    @Param('practiceWalletId') practiceWalletId: string,
    @GetCurrentUser() user: JwtUser,
  ) {
    const response =
      await this.practiceWalletService.getPracticeWalletByPracticeWalletId(
        user,
        practiceWalletId,
      );

    return response;
  }
  @Get('get-user-practice-wallet/:userId')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard, RolesGuard)
  @Roles(Role.USER, Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: '394ir-84736e5362-yw7qy3i38',
  })
  @SuccessMessage('User practice wallet fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get user practice wallet.',
    description:
      'This is the endpoint for fetching user practice wallet. This endpoint is expecting accessToken from req.headers and it is also expecting userId from req.params.',
  })
  @ApiResponse({
    status: 200,
    description: "User's practice wallet fetched successfully.",
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch user practice wallet.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async getMyPracticeWallet(
    @Param('userId') userId: string,
    @GetCurrentUser() user: JwtUser,
  ) {
    const response = await this.practiceWalletService.getMyPracticeWallet(
      user,
      userId,
    );

    return response;
  }

  @Get(
    'get-practice-point-transaction-by-transaction-id/:practicePointTransactionId',
  )
  @UseGuards(JwtAuthGuard, DeviceSessionGuard, RolesGuard)
  @Roles(Role.USER, Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: '394ir-84736e5362-yw7qy3i38',
  })
  @SuccessMessage('Practice point transaction fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get practice point transaction by transaction ID.',
    description:
      'This is the endpoint for fetching practice point transaction by transaction ID. This endpoint is expecting accessToken from req.headers and it is also expecting practicePointTransactionId from req.params.',
  })
  @ApiResponse({
    status: 200,
    description: 'Practice point transaction fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch practice point transaction.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async getPracticePointTransactionByTransactionId(
    @Param('practicePointTransactionId') practicePointTransactionId: string,
    @GetCurrentUser() user: JwtUser,
  ) {
    const response =
      await this.practiceWalletService.getPracticePointTransactionByTransactionId(
        practicePointTransactionId,
        user,
      );

    return response;
  }
  @Get('get-all-practice-point-transactions')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: '394ir-84736e5362-yw7qy3i38',
  })
  @SuccessMessage('All practice point transactions fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all practice point transactions.',
    description:
      'This is the endpoint for fetching all practice point transactions. This endpoint is expecting accessToken from req.headers and it is also expecting page, limit and searchParams from req.query.',
  })
  @ApiResponse({
    status: 200,
    description: 'Practice point transactions fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch practice point transactions.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async getAllPracticePointTransactions(
    @Query() queryDto: QueryWithPaginationDto,
  ) {
    const response =
      await this.practiceWalletService.getAllPracticePointTransactions(
        queryDto,
      );

    return response;
  }
  @Get('get-user-practice-point-transactions/:userId')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard, RolesGuard)
  @Roles(Role.USER, Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: '394ir-84736e5362-yw7qy3i38',
  })
  @SuccessMessage('All user practice point transactions fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all user practice point transactions.',
    description:
      'This is the endpoint for fetching all user practice point transactions. This endpoint is expecting accessToken from req.headers and it is also expecting userId from req.params.',
  })
  @ApiResponse({
    status: 200,
    description: "User's practice point transactions fetched successfully.",
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request. Unable to fetch user practice point transactions.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async getUserPracticePointTransactions(
    @Param('userId') userId: string,
    @Query() queryDto: QueryWithPaginationDto,
    @GetCurrentUser() user: JwtUser,
  ) {
    const response =
      await this.practiceWalletService.getUserPracticePointTransactions(
        user,
        userId,
        queryDto,
      );

    return response;
  }
}
