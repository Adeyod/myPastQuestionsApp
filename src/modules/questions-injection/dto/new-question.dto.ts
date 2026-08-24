import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ContentBlockDto } from './content-block.dto';
import { OptionDto } from './option.dto';

export class NewQuestionDto {
  @ApiProperty({
    description: 'Unique question ID',
    example: 'eng-2020-1',
  })
  @IsString()
  id!: string;

  @ApiProperty({
    description:
      'Main question content broken into blocks (text, image, math, table, graph, etc.)',
    type: [ContentBlockDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContentBlockDto)
  content!: ContentBlockDto[];

  @ApiPropertyOptional({
    description: 'Image ID.',
  })
  @IsOptional()
  @IsString()
  imageId?: string;

  @ApiPropertyOptional({
    description: 'List of answer options',
    type: [OptionDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OptionDto)
  options?: OptionDto[];

  @ApiPropertyOptional({
    description:
      'Correct answer(s). Use array to support multiple correct answers',
    example: ['a'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  correctAnswers?: string[];

  @ApiPropertyOptional({
    description: 'Explanation of the correct answer',
    example: 'Using substitution, we find that x = 5',
  })
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiPropertyOptional({
    description: 'Step-by-step explanation of the correct answer',
    example: [
      'Identify what the question is asking.',
      'Review each of the available options.',
      'Eliminate the options that are incorrect.',
      'Therefore, option A is the correct answer.',
    ],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  explanationSteps?: string[];

  @ApiPropertyOptional({
    description: 'Instruction for the question',
    example: 'Choose the correct answer',
  })
  @IsOptional()
  @IsString()
  instruction?: string;

  @ApiPropertyOptional({
    description: 'Topic/category of the question',
    example: 'Algebra',
  })
  @IsOptional()
  @IsString()
  topic?: string;

  @ApiPropertyOptional({
    description: 'Difficulty level',
    example: 'medium',
  })
  @IsOptional()
  @IsString()
  difficulty?: string;
}

// export class NewQuestionDto {
//   @IsString()
//   id!: string;

//   @IsArray()
//   @ValidateNested({ each: true })
//   @Type(() => ContentBlockDto)
//   content!: ContentBlockDto[];

//   @IsOptional()
//   @IsArray()
//   @ValidateNested({ each: true })
//   @Type(() => OptionDto)
//   options?: OptionDto[];

//   @IsOptional()
//   @IsArray()
//   @IsString({ each: true })
//   correctAnswers?: string[];

//   @IsOptional()
//   @IsString()
//   explanation?: string;

//   @IsOptional()
//   @IsString()
//   instruction?: string;

//   @IsOptional()
//   @IsString()
//   topic?: string;

//   @IsOptional()
//   @IsString()
//   difficulty?: string;
// }
