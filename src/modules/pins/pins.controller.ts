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
import { DeviceSessionGuard } from '../../common/guards/device-session.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { JwtUser } from '../../common/types/jwt-user.type';
import { Role } from '../users/schemas/user.schema';
import { AssignPinsDto } from './dto/assign-pins.dto';
import { GeneratePinsDto } from './dto/generate-pins.dto';
import { RedeemPinDto } from './dto/redeem-pin.dto';
import { PinsService } from './pins.service';
import { PinStatus } from './schemas/pin.schema';

@Controller('pins')
export class PinsController {
  constructor(private readonly pinsService: PinsService) {}

  @Post('generate')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: '394ir-84736e5362-yw7qy3i38',
  })
  @SuccessMessage('Subscription Pins generated successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate subscription pins',
    description: 'Frontend calls this endpoint to generate subscription pins.',
  })
  @ApiResponse({
    status: 200,
    description: 'Subscription Pins generated successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Subscription pins not found.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async generatePins(
    @Body() dto: GeneratePinsDto,
    @GetCurrentUser() user: JwtUser,
  ) {
    const response = await this.pinsService.generatePins(dto, user);

    return response;
  }

  @Post('assign')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: '394ir-84736e5362-yw7qy3i38',
  })
  @SuccessMessage('Subscription Pins assigned successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Assign subscription pins',
    description:
      'Frontend calls this endpoint to assign subscription pins to a vendor.',
  })
  @ApiResponse({
    status: 200,
    description: 'Subscription Pins assigned successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Subscription pins not found.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async assignPins(@Body() dto: AssignPinsDto) {
    const response = await this.pinsService.assignPins(
      dto.pinIds,
      dto.vendorId,
    );

    return response;
  }

  @Post(':pinId/sold')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: '394ir-84736e5362-yw7qy3i38',
  })
  @SuccessMessage('Subscription Pin sold successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Vendor sell subscription pin',
    description:
      'Frontend calls this endpoint when vendor sell subscription pin.',
  })
  @ApiResponse({
    status: 200,
    description: 'Subscription Pins sold successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Subscription pins not found.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async markAsSold(
    @Param('pinId') pinId: string,
    @GetCurrentUser() user: JwtUser,
  ) {
    const response = await this.pinsService.markAsSold(pinId, user);
    return response;
  }

  @Post('subscribe-to-plan-with-pin')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard)
  @Roles(Role.USER)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: '394ir-84736e5362-yw7qy3i38',
  })
  @SuccessMessage('Plan subscription is successful.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User subscribe to plan using subscription pin',
    description:
      'Frontend calls this endpoint to when user want to subscribe to a plan using subscription pin.',
  })
  @ApiResponse({
    status: 200,
    description: 'Plan subscription is successful.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Subscription pin not found.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async redeemPin(@Body() dto: RedeemPinDto, @GetCurrentUser() user: JwtUser) {
    const response = await this.pinsService.redeemPin(dto.pin, user);
    return response;
  }

  @Post(':pinId/revoke')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: '394ir-84736e5362-yw7qy3i38',
  })
  @SuccessMessage('Subscription pin revoked successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'This endpoint is called when admin want to revoke a subscription pin.',
    description:
      'Frontend calls this endpoint to when admin want to revoke a subscription pin.',
  })
  @ApiResponse({
    status: 200,
    description: 'Subscription pin revoked successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Subscription pin not found.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async revokePin(
    @Param('pinId') pinId: string,
    @GetCurrentUser() user: JwtUser,
  ) {
    const response = await this.pinsService.revokePin(pinId, user);
    return response;
  }

  @Get('vendor/:vendorId')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard)
  @Roles(Role.USER)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: '394ir-84736e5362-yw7qy3i38',
  })
  @SuccessMessage('Subscription pins fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'This endpoint is called when a vendor wanted to retrieve all the subscription pins assigned to him to sell.',
    description:
      'Frontend calls this endpoint when a vendor wanted to retrieve all the subscription pins assigned to him to sell.',
  })
  @ApiResponse({
    status: 200,
    description: 'Subscription pins fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Subscription pin not found.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getVendorPins(
    @Param('vendorId') vendorId: string,
    @Query('status') status: PinStatus | undefined,
    @GetCurrentUser() user: JwtUser,
  ) {
    const response = await this.pinsService.getVendorPins(
      vendorId,
      user,
      status,
    );

    return response;
  }

  @Get('batch/:batchId')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: '394ir-84736e5362-yw7qy3i38',
  })
  @SuccessMessage('Subscription pin batched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'This endpoint is called when admin want to get subscription pin by batch.',
    description:
      'Frontend calls this endpoint to when admin want to get subscription pin by batch.',
  })
  @ApiResponse({
    status: 200,
    description: 'Subscription pin batched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Subscription pin not found.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getBatch(@Param('batchId') batchId: string) {
    const response = await this.pinsService.getBatch(batchId);
    return response;
  }
}
