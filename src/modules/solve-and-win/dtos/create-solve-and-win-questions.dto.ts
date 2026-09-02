import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  SolveAndWinContentBlock,
  SolveAndWinDifficulty,
  SolveAndWinExamSection,
} from '../schemas/solve-and-win-question.schema';

export class CreateSolveAndWinOptionDto {
  @ApiProperty()
  @IsString()
  label!: string;

  @ApiProperty()
  @IsString()
  value!: string;
}

export class CreateSolveAndWinQuestionDto {
  @ApiProperty({
    type: [SolveAndWinContentBlock],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SolveAndWinContentBlock)
  content!: SolveAndWinContentBlock[];

  @ApiProperty()
  @IsString()
  question!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  instruction?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  topic?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(SolveAndWinExamSection)
  section?: SolveAndWinExamSection;

  @ApiProperty({
    type: [CreateSolveAndWinOptionDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSolveAndWinOptionDto)
  options!: CreateSolveAndWinOptionDto[];

  @ApiProperty({
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  correctAnswers!: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  answer?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  solution?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiPropertyOptional({
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  explanationSteps?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(SolveAndWinDifficulty)
  difficulty?: SolveAndWinDifficulty;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  examType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  examYear?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  apiSubjectName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isMultipleAnswer?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  marks?: number;
}
