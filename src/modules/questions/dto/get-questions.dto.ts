import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { PlanCode } from '../../plans/schemas/plan.schema';

export class GetQuestionsDto {
  @ApiProperty({
    description: 'This is the plan that the user want the questions from',
    example: PlanCode.SECONDARY,
  })
  @IsEnum(PlanCode)
  plan!: PlanCode;

  @ApiProperty({
    description: 'This is the subject ID',
    example: '69bd417a74676c09ac65bc56',
  })
  @IsString({ message: 'Subject ID' })
  subjectId!: string;

  @ApiProperty({
    description: 'This is the selected year',
    example: '2001',
  })
  @IsString({ message: 'Year must be a string' })
  year!: string;

  @ApiProperty({
    description: 'The exam type refers to the type of exam.',
    example: 'utme',
  })
  @IsString({ message: 'Exam type must be a string' })
  examType!: string;
}
