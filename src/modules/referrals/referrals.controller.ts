import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
import { RolesGuard } from '../../common/guards/roles.guard';
import type { JwtUser } from '../../common/types/jwt-user.type';
import { Role } from '../users/schemas/user.schema';
import { ReferralsService } from './referrals.service';

@Controller('referrals')
export class ReferralsController {
  constructor(private referralsService: ReferralsService) {}

  @Get('stats/:userId')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: 'device-123456789',
  })
  @SuccessMessage('User referral statistics fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get referral statistics of a particular user.',
    description:
      'This is the endpoint for getting the referral statistics of a particular user. This endpoint is accessible to user that owns the account and admin.',
  })
  @ApiResponse({
    status: 200,
    description: 'User referral statistics fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to fetch user referral statistics.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getReferralStats(
    @Param('userId') userId: string,
    @GetCurrentUser() user: JwtUser,
  ) {
    const res = await this.referralsService.getReferralStats(userId, user);
    console.log('res:', res);
    return res;
  }

  @Get('network/:userId')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: 'device-123456789',
  })
  @SuccessMessage('User referral network statistics fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get referral network statistics of a particular user.',
    description:
      'This is the endpoint for getting the direct referral network statistics of a particular user. This endpoint is accessible to user that owns the account and admin.',
  })
  @ApiResponse({
    status: 200,
    description: 'User referral network statistics fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to fetch user referral network statistics.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getReferralNetwork(
    @Param('userId') userId: string,
    @GetCurrentUser() user: JwtUser,
  ) {
    const res = await this.referralsService.getReferralNetwork(userId, user);
    console.log('res:', res);
    return res;
  }

  @Get('network/paid/:userId')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: 'device-123456789',
  })
  @SuccessMessage('User referral network statistics fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get referral network statistics of a particular user.',
    description:
      'This is the endpoint for getting the direct referral network statistics of a particular user. This endpoint is accessible to user that owns the account and admin.',
  })
  @ApiResponse({
    status: 200,
    description: 'User referral network statistics fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to fetch user referral network statistics.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getPaidAndUnpaidReferrals(
    @Param('userId') userId: string,
    @GetCurrentUser() user: JwtUser,
  ) {
    const res = await this.referralsService.getPaidAndUnpaidReferrals(
      userId,
      user,
    );
    console.log('res:', res);
    return res;
  }
}
