import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

import { CreateSchoolQuestionItemDto } from '../../school-questions/dtos/create-question.dto';
import {
  AssessmentMarkingMode,
  AssessmentType,
} from '../schemas/school-assessment.schema';

export class CreateAssessmentQuestionDto extends CreateSchoolQuestionItemDto {
  @ApiProperty({ example: 5, minimum: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  marks!: number;
}

export class CreateAssessmentDto {
  @ApiProperty()
  @IsMongoId()
  subjectId!: string;

  @ApiProperty()
  @IsMongoId()
  academicSessionId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  academicPeriodId?: string;

  @ApiProperty({
    type: [String],
    example: ['classId1', 'classId2'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsMongoId({ each: true })
  classIds!: string[];

  @ApiProperty({ example: 'First Continuous Assessment' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiProperty({ enum: AssessmentType })
  @IsEnum(AssessmentType)
  assessmentType!: AssessmentType;

  @ApiProperty({ enum: AssessmentMarkingMode })
  @IsEnum(AssessmentMarkingMode)
  markingMode!: AssessmentMarkingMode;

  @ApiProperty({ example: 45, minimum: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  durationMinutes!: number;

  @ApiPropertyOptional({ example: 20, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  passMark?: number;

  @ApiProperty({ example: '2026-12-01T09:00:00.000Z' })
  @IsDateString()
  startsAt!: string;

  @ApiProperty({ example: '2026-12-01T10:00:00.000Z' })
  @IsDateString()
  endsAt!: string;

  @ApiProperty({ type: [CreateAssessmentQuestionDto] })
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateAssessmentQuestionDto)
  questions!: CreateAssessmentQuestionDto[];
}
