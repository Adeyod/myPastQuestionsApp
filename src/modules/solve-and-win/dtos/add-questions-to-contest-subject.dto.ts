import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { CreateSolveAndWinQuestionDto } from './create-solve-and-win-questions.dto';

export class AddQuestionsToContestSubjectDto {
  @ApiProperty({
    type: [CreateSolveAndWinQuestionDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateSolveAndWinQuestionDto)
  questions!: CreateSolveAndWinQuestionDto[];

  @ApiProperty()
  @IsNumber()
  totalNumberOfExpectedQuestions!: number;
}
