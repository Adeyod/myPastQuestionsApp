import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class GetRoundQuestionDto {
  @ApiProperty({
    description: 'This is the quiz round question that need to be fetched.',
    example: 2,
  })
  @IsNumber()
  @Min(1)
  roundNumber!: number;
}
