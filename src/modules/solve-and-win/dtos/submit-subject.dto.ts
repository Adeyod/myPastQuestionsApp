// dto/submit-subject.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { SingleAnswerItemDto } from './update-answers.dto';

export class SubmitSolveAndWinSubjectDto {
  @ApiProperty({
    description: 'This is the information belonging to each round of the quiz.',
    type: [SingleAnswerItemDto],
    example: [
      {
        questionId: '69bd417a74676c09ac65bc56',
        selectedOption: '69bd417a74676c09ac65bc56',
      },
      {
        questionId: '69bd417a74676c09ac65bc56',
        selectedOption: '69bd417a74676c09ac65bc56',
      },
      {
        questionId: '69bd417a74676c09ac65bc56',
        selectedOption: '69bd417a74676c09ac65bc56',
      },
      {
        questionId: '69bd417a74676c09ac65bc56',
        selectedOption: '69bd417a74676c09ac65bc56',
      },
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SingleAnswerItemDto)
  answers!: SingleAnswerItemDto[];
}
