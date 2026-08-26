import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { SubmitQuestionDto } from './submit-question.dto';

export class SubmitPracticeDto {
  @ApiProperty({
    description: 'Array of questions and answers submitted by the student.',
    type: [SubmitQuestionDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubmitQuestionDto)
  questions!: SubmitQuestionDto[];
}
