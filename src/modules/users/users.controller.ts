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
import { Role } from './schemas/user.schema';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('/me')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard, RolesGuard)
  @Roles(Role.USER, Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: 'device-123456789',
  })
  @SuccessMessage('User details fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'This is for fetching the details of logged in user.',
    description:
      'This endpoint is for getting the details of logged in user. This endpoint can be used by the user that owns the account.',
  })
  @ApiResponse({
    status: 200,
    description: 'User details fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to get user details.',
  })
  @ApiResponse({
    status: 404,
    description: 'User details not found.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error.',
  })
  async getMyDetailsById(@GetCurrentUser() user: JwtUser) {
    const details = await this.usersService.findUserById(user.sub);
    console.log('details:', details);
    return details;
  }
  @Get('/get-user-details-by-userId/:userId')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('User details fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'This is for fetching the details of a user. This endpoint is mainly for admin',
    description:
      'This endpoint is for getting the details of a user. This endpoint can be admin to get details of a user.',
  })
  @ApiResponse({
    status: 200,
    description: 'User details fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to get user details.',
  })
  @ApiResponse({
    status: 404,
    description: 'User details not found.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error.',
  })
  async getUserDetailsById(@Param('userId') userId: string) {
    const id = new Types.ObjectId(userId);
    const userDetails = await this.usersService.findUserById(id);
    console.log('userDetails:', userDetails);
    return userDetails;
  }

  @Get('get-all-users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Users fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all users on the app.',
    description:
      'This is the endpoint that admin will use to fetch all users on the application.',
  })
  @ApiResponse({
    status: 200,
    description: 'Users fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request. Unable to get users.',
  })
  @ApiResponse({
    status: 404,
    description: 'Users not found.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error.',
  })
  async getAllUsers(@Query() queryWithPaginationDto: QueryWithPaginationDto) {
    return await this.usersService.getAllUsers(queryWithPaginationDto);
  }
}
