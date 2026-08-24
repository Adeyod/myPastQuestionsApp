import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Match } from '../../../common/decorators/match.decorator';

export class RegisterUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail()
  @IsString({ message: 'Email must be a string' })
  email!: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  @IsNotEmpty({ message: 'FIrst name is required.' })
  @IsString({ message: 'First name is a string' })
  @MinLength(2, { message: 'First name must be minimum of 2 characters long.' })
  firstName!: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  @IsNotEmpty({ message: 'Last name is required.' })
  @IsString({ message: 'Last name is a string' })
  @MinLength(2, { message: 'Last name must be minimum of 2 characters long.' })
  lastName!: string;

  @ApiProperty({
    description: 'User phone number',
    example: '08039283728',
  })
  @IsNotEmpty({ message: 'Phone number is required.' })
  @IsString({ message: 'Phone number must be a string' })
  @MinLength(11, {
    message: 'Phone number must be minimum of 11 characters long.',
  })
  phoneNumber!: string;

  @ApiProperty({ description: 'User password', example: 'StrongP@ssword1' })
  @IsNotEmpty({ message: 'Password is required.' })
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be minimum of 8 characters long.' })
  @MaxLength(32, {
    message: 'Password can not be more than 32 characters long.',
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
    description: 'The code of the person that referred this user',
    example: 'AP-293DR4',
  })
  @IsOptional()
  @IsString({ message: 'Referral code must be a string' })
  @Matches(/^[A-Z]{2}-[A-Z0-9]+$/, {
    message: 'Referral code must follow the format AP-293DR4',
  })
  referredBy?: string;
}
