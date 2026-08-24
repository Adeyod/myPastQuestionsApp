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
import { WalletsService } from './wallets.service';

@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get('get-wallet-by-userId/:userId')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: 'device-123456789',
  })
  @SuccessMessage('Wallet fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get the wallet details of a user.',
    description:
      'This is the endpoint for fetching the wallet details of a user. It can be used by the user that owns the account as well as admin.',
  })
  @ApiResponse({
    status: 200,
    description: 'Wallet fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch wallet',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async findWalletByUserId(
    @Param('userId') userId: string,
    @GetCurrentUser() user: JwtUser,
  ) {
    const response = await this.walletsService.findWalletByUserId(userId, user);
    console.log('response:', response);
    return response;
  }

  @Get('get-wallet-by-walletId/:walletId')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: 'device-123456789',
  })
  @SuccessMessage('Wallet fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get the wallet details of a user.',
    description:
      'This is the endpoint for fetching the wallet details of a user. It can be used by the user that owns the account as well as admin.',
  })
  @ApiResponse({
    status: 200,
    description: 'Wallet fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch wallet',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async findWalletById(
    @Param('walletId') walletId: string,
    @GetCurrentUser() user: JwtUser,
  ) {
    const response = await this.walletsService.findWalletById(walletId, user);
    console.log('response:', response);
    return response;
  }

  // @Put('debit-wallet-by-walletId/:walletId')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(Role.USER)
  // @ApiBearerAuth('JWT-auth')
  // @SuccessMessage('Wallet debited successfully.')
  // @HttpCode(HttpStatus.OK)
  // @ApiOperation({
  //   summary: 'Debit the wallet of a user.',
  //   description:
  //     'This is the endpoint for debiting the wallet of a user. It can be used by the user that owns the account.',
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Wallet debited successfully.',
  //   type: ApiResponseDto,
  // })
  // @ApiResponse({
  //   status: 400,
  //   description: 'Bad request. Unable to fetch wallet',
  // })
  // @ApiResponse({
  //   status: 500,
  //   description: 'Internal server error',
  // })
  // async debitWallet(
  //   @Param('walletId') walletId: string,
  //   @Body() amount: number,
  //   @GetCurrentUser() user: JwtUser,
  // ) {
  //   const response = await this.walletsService.debitWallet(
  //     walletId,
  //     amount,
  //     user,
  //   );
  //   console.log('response:', response);
  //   return response;
  // }

  @Get('get-wallet-balance-by-walletId/:walletId')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard, RolesGuard)
  @Roles(Role.USER)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: 'device-123456789',
  })
  @SuccessMessage('Wallet balance fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get wallet balance of a user.',
    description:
      'This is the endpoint for getting the wallet balance of a user. It can be used by the user that owns the account as well as admin.',
  })
  @ApiResponse({
    status: 200,
    description: 'Wallet balance fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch wallet',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getWalletBalance(
    @Param('walletId') walletId: string,
    @GetCurrentUser() user: JwtUser,
  ) {
    const response = await this.walletsService.getWalletBalance(walletId, user);
    console.log('response:', response);
    return response;
  }
}
