import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Match } from '../../../common/decorators/match.decorator';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'User password',
    example: 'StrongP@ssword1',
  })
  @IsNotEmpty({ message: 'Password is required' })
  @IsString({ message: 'Password must be string' })
  @MinLength(8, { message: 'Password must be minimum of 8 characters long.' })
  @MaxLength(32, {
    message: 'Password can not be more than 32 characters long',
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  password!: string;

  @ApiProperty({
    description: 'User confirm password',
    example: 'StrongP@ssword1',
  })
  @Match('password', {
    message: 'Password and confirm password mush match',
  })
  confirmPassword!: string;

  @ApiProperty({
    description: 'Password reset token',
    example: '203948',
  })
  @IsNotEmpty({ message: 'Token is required' })
  @IsString({ message: 'Token is a string' })
  @Length(6, 6)
  token!: string;
}
