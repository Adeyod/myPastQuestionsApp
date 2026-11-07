import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateSchoolSubjectDto {
  @ApiProperty({
    description: 'This is the subject name of the school.',
    example: 'Physics',
  })
  @IsString({ message: 'Subject name is a string' })
  @IsNotEmpty({ message: 'Subject name is required' })
  @MaxLength(100, {
    message: 'Subject name can have maximum of 100 characters.',
  })
  subjectName!: string;

  @ApiProperty({
    description: 'This is the subject code.',
    example: 'PHY 101',
  })
  @IsString({ message: 'Subject code is a string' })
  @IsNotEmpty({ message: 'Subject code is required.' })
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9 _-]+$/, {
    message:
      'Subject code can only contain letters, numbers, spaces, underscores and hyphens.',
  })
  subjectCode!: string;

  @ApiPropertyOptional({
    description: 'This is the description about the subject. This is optional.',
    example: 'This is the first subject in the school.',
  })
  @IsOptional()
  @IsString({ message: 'Description is a string' })
  @MaxLength(500, { message: 'Description is maximum of 500 characters.' })
  description?: string;
}
