import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsMongoId,
  IsNotEmpty,
  ValidateNested,
} from 'class-validator';

export class SingleAnswerItemDto {
  @ApiProperty({
    description: 'Question ID',
    example: '69bd417a74676c09ac65bc56',
  })
  @IsMongoId()
  @IsNotEmpty()
  questionId!: string;

  @ApiProperty({
    description: 'ID of the selected option',
    example: '69bd417a74676c09ac65bc56',
  })
  @IsMongoId()
  @IsNotEmpty()
  selectedOption!: string;
}

export class UpdateParticipationAnswersDto {
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
