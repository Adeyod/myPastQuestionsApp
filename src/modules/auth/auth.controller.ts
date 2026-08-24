import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { GetCurrentUser } from '../../common/decorators/get-current-user.decorator';
import { SuccessMessage } from '../../common/decorators/success-message.decorator';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { DeviceSessionGuard } from '../../common/guards/device-session.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { JwtUser } from '../../common/types/jwt-user.type';
import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshTokenGuard } from './guards/refresh-token.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @SuccessMessage('Registration successful')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a user',
    description:
      'Creates a new user. This is the endpoint for user creation. All type of roles can use this endpoint.',
  })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Validation failed or unable to create user',
  })
  @ApiResponse({
    status: 409,
    description: 'User with this email already exist',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async registerUser(@Body() registerUserDto: RegisterUserDto) {
    return await this.authService.registerUser(registerUserDto);
  }

  @Get('verify-email/:token')
  @SuccessMessage('Email verification successful')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify email address',
    description:
      'Verify user email address using token. This is the endpoint for verifying user email. It is expecting token from req.param. All type of roles can use this endpoint.',
  })
  @ApiResponse({
    status: 200,
    description: 'Email verification successful',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Email verification failed.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async verifyUserEmail(@Param('token') token: string) {
    return await this.authService.verifyUserEmail(token);
  }

  @Post('login')
  @SuccessMessage('User login successful')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login user',
    description:
      'User login using email and password. All type of roles can use this endpoint.',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Login failed',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async loginUser(@Body() loginDto: LoginDto) {
    return await this.authService.loginUser(loginDto);
  }

  @Post('force-switch')
  @SuccessMessage('User force switch successful')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User forced switch',
    description:
      'User forced switch. The initial user session on the previous device will be invalidated and new one is created for the new device.',
  })
  @ApiResponse({
    status: 200,
    description: 'User force switch successful',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'User force switch failed',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async forceSwitch(@Body() loginDto: LoginDto) {
    const response = await this.authService.forceSwitch(loginDto);

    return response;
  }

  @Post('forgot-password')
  @SuccessMessage(
    'Please use the token sent to your email address to reset your password.',
  )
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Forgot password',
    description:
      'Get token in your email to reset your password. This endpoint is expecting email address from req.body. All type of roles can use this endpoint.',
  })
  @ApiResponse({
    status: 200,
    description: 'Endpoint to get token for reseting password',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Forgot password failed',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return await this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('request-access-token')
  @UseGuards(RefreshTokenGuard, DeviceSessionGuard)
  @ApiBearerAuth('JWT-refresh')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: 'device-123456789',
  })
  @SuccessMessage('Access token generated successfully')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request for another access token',
    description:
      'Get another access token. All type of roles can use this endpoint.',
  })
  @ApiResponse({
    status: 200,
    description: 'Access token generated successfully',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Access token generation failed',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async requestAccessToken(@GetCurrentUser() user: JwtUser) {
    return await this.authService.requestAccessToken(user);
  }

  @Post('resend-email-verification')
  @SuccessMessage(
    'A new Email verification token has been sent successfully. Please check your email address',
  )
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request for another token to verify email',
    description:
      'Get another token to verify your email. This endpoint is expecting email from req.body. All type of roles can use this endpoint.',
  })
  @ApiResponse({
    status: 200,
    description:
      'A new Email verification token has been sent successfully. Please check your email address',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Resend email verification failed',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async resendEmailVerificationToken(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ) {
    return await this.authService.resendEmailVerificationToken(
      forgotPasswordDto,
    );
  }

  @Post('reset-password')
  @SuccessMessage('Password changed successfully')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Change user password',
    description:
      'Change user password. This endpoint is expecting token, password and confirmPassword from req.body. All type of roles can use this endpoint.',
  })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Password change failed',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return await this.authService.resetPassword(resetPasswordDto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-refresh-token',
    description: 'Refresh token. All type of roles can use this endpoint.',
    required: true,
  })
  @SuccessMessage('User logged out successfully')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User log out',
    description: 'Log the user out',
  })
  @ApiResponse({
    status: 200,
    description: 'User logged out successfully',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Logout failed',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async logoutUser(@GetCurrentUser() user: JwtUser, @Req() req: Request) {
    return await this.authService.logoutUser(req, user);
  }
}
