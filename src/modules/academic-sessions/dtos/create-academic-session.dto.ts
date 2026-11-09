import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { AcademicPeriodType } from '../schemas/academic-session.schema';

export class CreateAcademicSessionDto {
  @ApiProperty({
    example: '2026/2027',
    description: 'Name of the academic session.',
  })
  @IsString()
  @MinLength(4)
  @MaxLength(30)
  sessionName!: string;

  @ApiPropertyOptional({
    example: 'Undergraduate',
    description:
      'Optional section or programme this academic session belongs to.',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  sectionName?: string;

  @ApiProperty({
    enum: AcademicPeriodType,
    example: AcademicPeriodType.TERM,
  })
  @IsEnum(AcademicPeriodType)
  periodType!: AcademicPeriodType;

  @ApiProperty({
    example: '2026-09-01',
  })
  @IsDateString()
  startDate!: string;

  @ApiProperty({
    example: '2027-07-31',
  })
  @IsDateString()
  endDate!: string;
}
