import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, Min } from 'class-validator';

export class UpdateRemainingTimeDto {
  @ApiProperty({
    description: 'Remaining time for taking the subject questions',
    example: 8,
  })
  @IsInt()
  @Min(0)
  @IsNotEmpty()
  remainingDurationInSeconds!: number;
}
