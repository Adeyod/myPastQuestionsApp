import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsOptional, IsString } from 'class-validator';

export class SubmitQuestionDto {
  @ApiProperty({
    description: 'The ID of the question being answered.',
    example: '68c123456789abcdef123456',
  })
  @IsMongoId()
  questionId!: string;

  @ApiPropertyOptional({
    description:
      'The option selected by the student. Leave empty if the question was not answered.',
    example: 'B',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  selectedOption?: string | null;
}
