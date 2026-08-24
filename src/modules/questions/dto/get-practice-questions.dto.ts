import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';
import { ExamType } from '../../../common/enums/exam-type.enum';

export class GetPracticeQuestionsDto {
  @ApiProperty({
    description: 'This is the subject ID',
    example: '69bd417a74676c09ac65bc56',
  })
  @IsString({ message: 'Subject ID' })
  subjectId!: string;

  @ApiProperty({
    description: 'This is the selected mode',
    example: 'quick',
  })
  @IsString({ message: 'Mode must be a string' })
  mode!: string;

  @ApiProperty({
    description: 'The total number of questions that frontend is expecting.',
    example: 20,
  })
  @IsNumber()
  questionCount!: number;

  @ApiProperty({
    description: 'The duration for the question practice.',
    example: 20,
  })
  @IsNumber()
  duration!: number;

  @ApiProperty({
    description: 'The exam type refers to the type of exam.',
    example: 'jamb',
  })
  @IsString({ message: 'Exam type must be a string' })
  examType!: ExamType;
}
