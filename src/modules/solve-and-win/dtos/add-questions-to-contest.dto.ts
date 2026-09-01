import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsMongoId, IsNotEmpty } from 'class-validator';

export class AddQuestionsToContestDto {
  @ApiProperty({
    description: 'Subject ID',
    example: 'ei3392ue8394jf9550dj49fj',
  })
  @IsMongoId()
  @IsNotEmpty()
  subjectId!: string;

  @ApiProperty({
    example: [
      'ei3392ue8394jf9550dj49fj',
      'ei3392ue8394jf9550dj49fj',
      'ei3392ue8394jf9550dj49fj',
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsMongoId({ each: true })
  questionIds!: string[];
}
