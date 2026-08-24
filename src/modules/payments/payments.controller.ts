import {
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
import { PlanCode } from '../plans/schemas/plan.schema';
import { Role } from '../users/schemas/user.schema';
import { PaymentsService } from './payments.service';
import { PaymentProvider } from './schemas/payment.schema';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}
  @Post('create-payment-intent/:provider/:plan')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard, RolesGuard)
  @Roles(Role.USER)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: 'device-123456789',
  })
  @SuccessMessage('Payment intent successfully created.')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'User creates payment intent',
    description:
      'This is the endpoint to be called when user clicks on button to make payment. This endpoint returns with payment processor URL for user to make the payment. This endpoint can only be accessed by user.',
  })
  @ApiResponse({
    status: 201,
    description: 'Payment intent successfully created.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to create payment intent.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async createPaymentIntent(
    @Param('provider') provider: PaymentProvider,
    @Param('plan') plan: PlanCode,
    @GetCurrentUser() user: JwtUser,
  ) {
    return await this.paymentsService.createPaymentIntent(provider, plan, user);
  }

  @Get('get-all-user-payments/:userId')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard, RolesGuard)
  @Roles(Role.USER, Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: 'device-123456789',
  })
  @SuccessMessage('All payments of this user fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all payments for a user.',
    description:
      'This is the endpoint for fetching all the payments of a user. This endpoint is expecting accessToken from req.headers and it is also expecting userId from req.params. This endpoint can be accessed by the payment owner as well as the admin.',
  })
  @ApiResponse({
    status: 200,
    description: "User's payments fetched successfully.",
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch payments',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async getAllPaymentsOfAUserByUserId(
    @Param('userId') userId: string,
    @Query() queryWithPaginationDto: QueryWithPaginationDto,
    @GetCurrentUser() user: JwtUser,
  ) {
    return this.paymentsService.getAllPaymentsOfAUserByUserId(
      user,
      queryWithPaginationDto,
      userId,
    );
  }

  @Get('get-all-payments')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: 'device-123456789',
  })
  @SuccessMessage('All payments fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all payments on the app.',
    description:
      'This is the endpoint for fetching all the payments on the application. This endpoint is expecting accessToken from req.params and it can only be used by admin only.',
  })
  @ApiResponse({
    status: 200,
    description: 'Payments fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch payments',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async getAllPayments(
    @Query() queryWithPaginationDto: QueryWithPaginationDto,
  ) {
    return this.paymentsService.getAllPayments(queryWithPaginationDto);
  }

  @Get('verify-payment/:reference')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: 'device-123456789',
  })
  @SuccessMessage('Payment status fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify payment status',
    description:
      'Frontend calls this endpoint to confirm if a payment was successful using the payment reference.',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment status fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Payment not found.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async verifyPayment(
    @Param('reference') reference: string,
    @GetCurrentUser() user: JwtUser,
  ) {
    return await this.paymentsService.verifyPayment(reference, user);
  }
}
