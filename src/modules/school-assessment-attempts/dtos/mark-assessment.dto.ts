import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsMongoId,
  IsNumber,
  Min,
  ValidateNested,
} from 'class-validator';

export class MarkAssessmentAnswerDto {
  @ApiProperty()
  @IsMongoId()
  questionId!: string;

  @ApiProperty({
    example: 5,
    description: 'Marks awarded by the teacher.',
  })
  @IsNumber()
  @Min(0)
  marksAwarded!: number;
}

export class MarkAssessmentAttemptDto {
  @ApiProperty({
    type: [MarkAssessmentAnswerDto],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => MarkAssessmentAnswerDto)
  answers!: MarkAssessmentAnswerDto[];
}
