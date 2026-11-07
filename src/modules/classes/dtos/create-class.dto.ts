import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateClassDto {
  @ApiProperty({
    description: 'This is the class name of the school.',
    example: 'JSS 1',
  })
  @IsString({ message: 'Class name is a string' })
  @IsNotEmpty({ message: 'Class name is required' })
  @MaxLength(100, { message: 'Class name can have maximum of 100 characters.' })
  className!: string;

  @ApiProperty({
    description: 'This is the class code.',
    example: 'JSS 1A',
  })
  @IsString({ message: 'Class code is a string' })
  @IsNotEmpty({ message: 'Class code is required.' })
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9 _-]+$/, {
    message:
      'Class code can only contain letters, numbers, spaces, underscores and hyphens.',
  })
  classCode!: string;

  @ApiPropertyOptional({
    description: 'This is the description about the class. This is optional.',
    example: 'This is the first class in the school.',
  })
  @IsOptional()
  @IsString({ message: 'Description is a string' })
  @MaxLength(500, { message: 'Description is maximum of 500 characters.' })
  description?: string;
}
