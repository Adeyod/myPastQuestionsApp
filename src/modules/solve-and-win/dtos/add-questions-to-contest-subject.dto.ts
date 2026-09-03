import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { CreateSolveAndWinQuestionDto } from './create-solve-and-win-questions.dto';

export class AddQuestionsToContestSubjectDto {
  @ApiProperty({
    type: [CreateSolveAndWinQuestionDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CreateSolveAndWinQuestionDto)
  questions!: CreateSolveAndWinQuestionDto[];
}
