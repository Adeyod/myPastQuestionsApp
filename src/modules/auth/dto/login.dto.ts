import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail()
  @IsString({ message: 'Email must be string' })
  email!: string;

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
    description: 'This is the ID of the device of the user.',
    example: '394ir-84736e5362-yw7qy3i38',
  })
  @IsString()
  deviceId!: string;

  @ApiProperty({
    description: 'This is the name of the device of the user',
    example: 'iPhone 12 Promax',
  })
  @IsString()
  deviceName!: string;
}
