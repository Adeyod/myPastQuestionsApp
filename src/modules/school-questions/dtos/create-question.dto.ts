import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import {
  SchoolQuestionDifficulty,
  SchoolQuestionType,
} from '../schemas/school-question.schema';

export class CreateSchoolQuestionOptionDto {
  @ApiProperty({ example: 'A' })
  @IsString()
  @IsNotEmpty()
  key!: string;

  @ApiProperty({ example: 'Lagos' })
  @IsString()
  @IsNotEmpty()
  text!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class CreateSchoolQuestionAnswerKeyDto {
  @ApiPropertyOptional({ example: 'A' })
  @IsOptional()
  @IsString()
  correctOptionKey?: string;

  @ApiPropertyOptional({ example: ['A', 'C'] })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  correctOptionKeys?: string[];

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  correctBoolean?: boolean;

  @ApiPropertyOptional({ example: ['Photosynthesis'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  acceptedAnswers?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  modelAnswer?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  markingGuide?: string;
}

export class CreateSchoolQuestionItemDto {
  @ApiProperty({ enum: SchoolQuestionType })
  @IsEnum(SchoolQuestionType)
  questionType!: SchoolQuestionType;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  questionText!: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  questionImages?: string[];

  @ApiPropertyOptional({ type: [CreateSchoolQuestionOptionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSchoolQuestionOptionDto)
  options?: CreateSchoolQuestionOptionDto[];

  @ApiPropertyOptional({ type: CreateSchoolQuestionAnswerKeyDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateSchoolQuestionAnswerKeyDto)
  answerKey?: CreateSchoolQuestionAnswerKeyDto;

  @ApiPropertyOptional({ enum: SchoolQuestionDifficulty })
  @IsOptional()
  @IsEnum(SchoolQuestionDifficulty)
  difficulty?: SchoolQuestionDifficulty;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  topic?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  explanation?: string;
}

export class CreateSchoolQuestionsDto {
  @ApiProperty()
  @IsMongoId()
  subjectId!: string;

  @ApiProperty({ type: [String], example: ['classId1', 'classId2'] })
  @IsArray()
  @ArrayMinSize(1)
  @IsMongoId({ each: true })
  classIds!: string[];

  @ApiProperty({ type: [CreateSchoolQuestionItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateSchoolQuestionItemDto)
  questions!: CreateSchoolQuestionItemDto[];
}
