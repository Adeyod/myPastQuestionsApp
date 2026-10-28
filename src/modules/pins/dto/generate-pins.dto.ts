import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsMongoId, Max, Min } from 'class-validator';

export class GeneratePinsDto {
  @ApiProperty({
    description: 'Plan ID',
    example: '6a7b0abcafa6aaf987e9ca3b',
  })
  @IsMongoId()
  planId!: string;

  @ApiProperty({
    description: 'This is the number of pins to be created at ones.',
    example: 50,
  })
  @IsInt()
  @Min(1)
  @Max(500)
  quantity!: number;

  // @ApiPropertyOptional({
  //   description: 'This is the time for it to expire. It is optional',
  // })
  // @IsOptional()
  // @IsDateString()
  // expiresAt?: string;
}
