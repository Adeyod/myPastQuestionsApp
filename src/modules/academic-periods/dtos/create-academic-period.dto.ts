import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateAcademicPeriodDto {
  @ApiProperty({
    example: 'First Term',
    description: 'Name of the academic period.',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  periodName!: string;

  @ApiProperty({
    example: 1,
    description: 'Sequence number of the period within the academic session.',
  })
  @IsInt()
  @Min(1)
  periodNumber!: number;

  @ApiProperty({
    example: '2026-09-01',
    description: 'Academic period start date.',
  })
  @IsDateString()
  startDate!: string;

  @ApiProperty({
    example: '2026-12-18',
    description: 'Academic period end date.',
  })
  @IsDateString()
  endDate!: string;
}
