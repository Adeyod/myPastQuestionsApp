import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ExamType } from '../../../common/enums/exam-type.enum';
import { QuestionType } from '../../../common/enums/question-type.enum';
import { ExamSection } from '../../questions/schemas/question.schema';
import { NewQuestionDto } from './new-question.dto';

// export class QuestionObjDto {
//   @ApiProperty({
//     description:
//       'This is the ID coming from the third party API or other sources.',
//     example: 'eng-2000-1',
//   })
//   @IsNotEmpty({ message: 'ID is required.' })
//   @IsString({ message: 'ID is a string' })
//   id!: string;

//   @ApiProperty({
//     description: 'This is the question.',
//     example: 'define noun',
//   })
//   @IsNotEmpty({ message: 'Question is required.' })
//   @IsString({ message: 'Question is a string' })
//   question!: string;

//   @ApiProperty({
//     description: 'This is the options to the question.',
//     example: {
//       a: 'Noun is the name of any person, animal, place or things.',
//       b: 'Noun is the name of any person, animal, place or things.',
//       c: 'Noun is the name of any person, animal, place or things.',
//       d: 'Noun is the name of any person, animal, place or things.',
//     },
//   })
//   @IsOptional()
//   @IsObject()
//   @Transform(({ value }) => {
//     if (!value) return value;

//     return Object.fromEntries(
//       Object.entries(value).map(([key, val]) => [key.toLowerCase(), val]),
//     );
//   })
//   options!: {
//     a?: string;
//     b?: string;
//     c?: string;
//     d?: string;
//     e?: string;
//   };

//   @ApiProperty({
//     description: 'This is the answer.',
//   })
//   @IsOptional()
//   @IsString({ message: 'Answer is a string' })
//   answer?: string;

//   @IsOptional()
//   @IsString()
//   passage?: string;

//   @IsOptional()
//   @IsString()
//   instruction?: string;

//   @ApiProperty({
//     description: 'Explanation to the answer.',
//   })
//   @IsString({ message: 'Question is a string' })
//   explanation?: string;

//   @ApiProperty({
//     description: 'Difficulty level of the question.',
//   })
//   @IsOptional()
//   @IsString({ message: 'Difficulty is a string' })
//   difficulty?: string;

//   @ApiProperty({
//     description: 'Explanation to the answer.',
//   })
//   @IsOptional()
//   @IsString({ message: 'Topic is a string' })
//   topic?: string;
// }

export class QuestionObjDto {
  @ApiProperty({
    description:
      'Unique question ID from external source (e.g., API or scraper)',
    example: 'eng-2000-1',
  })
  @IsNotEmpty()
  @IsString()
  id!: string;

  @ApiPropertyOptional({
    description:
      'Multiple choice options as key-value pairs. Keys must be a, b, c, d, e',
    example: {
      a: 'Name of a person',
      b: 'Name of an action',
      c: 'Name of a place',
      d: 'Name of a thing',
    },
  })
  @IsOptional()
  @IsObject()
  @Transform(({ value }) => {
    if (!value) return value;

    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [
        key.toLowerCase(),
        typeof val === 'string' ? val : String(val),
      ]),
    );
  })
  options!: {
    a?: string;
    b?: string;
    c?: string;
    d?: string;
    e?: string;
  };

  @ApiPropertyOptional({
    description: 'Correct answer (must match one of the option keys)',
    example: 'a',
  })
  @IsOptional()
  @IsString()
  answer?: string;

  @ApiPropertyOptional({
    description:
      'Passage for comprehension questions (used for multiple related questions)',
    example: 'Read the passage below and answer questions 5–10...',
  })
  @IsOptional()
  @IsString()
  passage?: string;

  @ApiPropertyOptional({
    description: 'Instruction for the question',
    example: 'Choose the correct answer from the options below.',
  })
  @IsOptional()
  @IsString()
  instruction?: string;

  @ApiPropertyOptional({
    description: 'Detailed explanation of the correct answer',
    example: 'A noun is a naming word.',
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
    description: 'Difficulty level of the question',
    example: 'easy',
  })
  @IsOptional()
  @IsString()
  difficulty?: string;

  @ApiPropertyOptional({
    description: 'Topic or category of the question',
    example: 'Parts of Speech',
  })
  @IsOptional()
  @IsString()
  topic?: string;
}

export class QuestionInjectionDto {
  @ApiProperty({
    description: 'Exam year',
    example: '2020',
  })
  @IsString()
  year!: string;

  @ApiProperty({
    description: 'Type of exam',
    enum: ExamType,
    example: ExamType.waec,
  })
  @IsEnum(ExamType)
  examType!: ExamType;

  @ApiProperty({
    description: 'Subject name',
    example: 'English',
  })
  @IsString()
  subject!: string;

  @ApiProperty({
    description: 'Section of the exam',
    enum: ExamSection,
    example: ExamSection.objective,
  })
  @IsEnum(ExamSection)
  section!: ExamSection;

  @ApiProperty({
    description: 'Question type',
    enum: QuestionType,
    example: QuestionType.MCQ,
  })
  @IsEnum(QuestionType)
  type!: QuestionType;

  @ApiProperty({
    description: 'List of questions to insert',
    type: [NewQuestionDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NewQuestionDto)
  questions!: NewQuestionDto[];
}

// export class QuestionInjectionDto {
//   @IsString()
//   year!: string;

//   @IsEnum(ExamType)
//   examType!: ExamType;

//   @IsString()
//   subject!: string;

//   @IsEnum(ExamSection)
//   section!: ExamSection;

//   @IsEnum(QuestionType)
//   type!: QuestionType;

//   @IsArray()
//   @ValidateNested({ each: true })
//   @Type(() => NewQuestionDto)
//   questions!: NewQuestionDto[];
// }

// export class QuestionInjectionDto {
//   @ApiProperty({
//     description: 'This is the exam year.',
//     example: '2000',
//   })
//   @IsNotEmpty({ message: 'Year is required' })
//   @IsString({ message: 'Year is a string' })
//   year!: string;

//   @ApiProperty({
//     description: 'This is the type of exam.',
//     example: ExamType.waec,
//   })
//   @IsNotEmpty({ message: 'Exam type is required' })
//   @IsString({ message: 'Exam type is a string' })
//   examType!: ExamType;

//   @ApiProperty({
//     description: 'This is the subject name.',
//     example: 'physics',
//   })
//   @IsNotEmpty({ message: 'Subject is required' })
//   @IsString({ message: 'Subject is a string' })
//   subject!: string;

//   @ApiProperty({
//     description: 'This is the section that the exam belong to.',
//     example: 'objective',
//   })
//   @IsString({ message: 'Section is a string' })
//   section!: ExamSection;

//   @ApiProperty({
//     description:
//       'This is the type that the questions belong to. it can be any of these: mcq, essay or theory',
//     example: 'mcq',
//   })
//   @IsEnum(QuestionType)
//   type!: QuestionType;

//   @ApiProperty({
//     description: 'This is the question array.',
//     example: [
//       {
//         id: 'eng-2000-1',
//         question:
//           'Choose the option nearest in meaning to the word underlined: The man was very frugal.',
//         options: { A: 'stingy', B: 'generous', C: 'careless', D: 'wasteful' },
//         answer: 'A',
//         explanation: 'Frugal means economical or stingy.',
//       },
//     ],
//   })
//   @IsArray()
//   @ValidateNested({ each: true })
//   @Type(() => QuestionObjDto)
//   questions!: QuestionObjDto[];
// }
