import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class AssessmentAnswerDto {
  @IsMongoId()
  questionId!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  selectedOptionKeys?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  textAnswer?: string;
}

export class UpdateAssessmentAnswersDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssessmentAnswerDto)
  @ArrayMaxSize(200)
  answers!: AssessmentAnswerDto[];
}
