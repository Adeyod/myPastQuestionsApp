import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  ValidateNested,
} from 'class-validator';

import { AssessmentAnswerDto } from './update-assessment-answers.dto';

export class SubmitAssessmentAttemptDto {
  @ApiPropertyOptional({
    description:
      'Optional answers to save before submitting the assessment attempt.',
    type: [AssessmentAnswerDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssessmentAnswerDto)
  @ArrayMaxSize(200)
  answers?: AssessmentAnswerDto[];
}
