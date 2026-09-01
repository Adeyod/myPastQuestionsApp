import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsMongoId } from 'class-validator';

export class RemoveSubjectsFromContestDto {
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
  subjectIds!: string[];
}
