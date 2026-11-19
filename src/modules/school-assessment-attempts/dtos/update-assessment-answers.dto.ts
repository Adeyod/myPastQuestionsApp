import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiProperty({
    description: 'ID of the question being answered.',
    example: '671234567890123456789012',
  })
  @IsMongoId()
  questionId!: string;

  @ApiPropertyOptional({
    description: 'Keys of the selected options (A, B, C, D).',
    example: ['A', 'C'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  selectedOptionKeys?: string[];

  @ApiPropertyOptional({
    description: 'Text answer for questions without selectable options.',
    example: 'Abuja',
    maxLength: 10000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  textAnswer?: string;
}

export class UpdateAssessmentAnswersDto {
  @ApiProperty({
    description: 'Answers being saved for the assessment attempt.',
    type: [AssessmentAnswerDto],
    example: [
      {
        questionId: '671234567890123456789012',
        selectedOptionKeys: ['A'],
      },
      {
        questionId: '671234567890123456789013',
        textAnswer: 'Abuja',
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssessmentAnswerDto)
  @ArrayMaxSize(200)
  answers!: AssessmentAnswerDto[];
}
