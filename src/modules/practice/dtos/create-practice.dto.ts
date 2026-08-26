import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ExamType } from '../../../common/enums/exam-type.enum';

export class SingleQuestionObjDto {
  @ApiProperty({
    description:
      'Unique question ID from external source (e.g., API or scraper)',
    example: 'eng-2000-1',
  })
  @IsNotEmpty()
  @IsMongoId()
  questionId!: string;

  @IsString({ message: 'Subject ID is required.' })
  selectedOption!: string | null;

  @IsBoolean()
  isSelectedAnswerCorrect!: boolean | null;

  @IsNumber()
  marksAwarded!: number;

  @IsNumber()
  pointsAwarded!: number;
}
export class CreatePracticeDto {
  @ApiProperty({
    description:
      'This is the ID of the subject that the user want to practice.',
    example: '203k5fj395jd03tk49rj4o5',
  })
  @IsString({ message: 'Subject ID is required.' })
  subjectId!: string;

  @ApiProperty({
    description: 'This is the exam type that the user want to practice.',
    example: ExamType.jamb,
  })
  @IsEnum(ExamType)
  @IsString({ message: 'Exam type is required.' })
  examType!: ExamType;

  @ApiProperty({
    description:
      'This is the ID of the practice mode that the user want to practice.',
    example: '203k5fj395jd03tk49rj4o5',
  })
  @IsString({ message: 'Practice mode ID is required.' })
  practiceModeId!: string;

  @ApiProperty({
    description:
      'This is the number of questions that the user want to practice.',
    example: 20,
  })
  @IsNumber({})
  questionCount!: number;

  @ApiProperty({
    description: 'This is the questions that the user want to practice.',
    example: '203k5fj395jd03tk49rj4o5',
  })
  @IsArray({})
  @ValidateNested({ each: true })
  @Type(() => SingleQuestionObjDto)
  questions!: SingleQuestionObjDto[];

  @ApiProperty({
    description:
      'This is the total duration in seconds that the user is going to use to practice.',
    example: '203k5fj395jd03tk49rj4o5',
  })
  @IsNumber({})
  totalDurationInSeconds!: number;
}
