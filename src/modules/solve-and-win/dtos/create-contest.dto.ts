import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { SolveAndWinContestStatus } from '../schemas/solve-and-win-contest.schema';

export class DifficultyBreakdownDto {
  @ApiProperty({
    description: 'Number of easy questions',
    example: 8,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  easy!: number;

  @ApiProperty({
    description: 'Number of medium questions',
    example: 7,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  medium!: number;

  @ApiProperty({
    description: 'Number of hard questions',
    example: 5,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  hard!: number;
}

export class ContestSubjectDto {
  @ApiProperty({
    description: 'Subject ID',
    example: '69bd417a74676c09ac65bc56',
  })
  @IsMongoId()
  @IsNotEmpty()
  subjectId!: string;

  @ApiProperty({
    description: 'Expected number of questions for this subject',
    example: 20,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  expectedNoOfQuestions!: number;

  @ApiProperty({
    description:
      'Time allowed to answer questions for this subject, in minutes',
    example: 30,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  durationInMinutes!: number;

  @ApiProperty({
    description: 'Breakdown of the expected questions by difficulty level',
    type: DifficultyBreakdownDto,
    example: {
      easy: 8,
      medium: 7,
      hard: 5,
    },
  })
  @ValidateNested()
  @Type(() => DifficultyBreakdownDto)
  difficultyBreakdown!: DifficultyBreakdownDto;
}

export class CreateSolveAndWinContestDto {
  @ApiProperty({
    description: 'Title',
    example: 'JAMB Solve and Win Contest',
  })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({
    description: 'Description',
    example: 'JAMB Solve and Win Contest',
  })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({
    description: 'Category',
    example: 'National',
  })
  @IsString()
  @IsNotEmpty()
  category!: string;

  @ApiProperty({
    description: 'Title',
    example: SolveAndWinContestStatus.DRAFT,
  })
  @IsString()
  @IsEnum(SolveAndWinContestStatus)
  status!: SolveAndWinContestStatus;

  @ApiProperty({
    description: 'Amount to win',
    example: 100000000,
  })
  @IsNumber()
  @Min(0)
  amountToBeWonInKobo!: number;

  @ApiProperty({
    description: 'Points needed to participate in the contest.',
    example: 500,
  })
  @IsNumber()
  @Min(1)
  entryPoints!: number;

  @ApiProperty({
    description: 'Start Date',
    example: '2026-05-04',
  })
  @IsDateString()
  startDate!: string;

  @ApiProperty({
    description:
      'Number of days participants are allowed to participate in the contest',
    example: 3,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  windowPeriod!: number;

  @ApiProperty({
    description: 'Subjects included in the contest',
    type: [ContestSubjectDto],
    example: [
      {
        subjectId: '69bd417a74676c09ac65bc56',
        expectedNoOfQuestions: 20,
        difficultyBreakdown: {
          easy: 8,
          medium: 7,
          hard: 5,
        },
        durationInMinutes: 20,
      },
      {
        subjectId: '69bd4ca6b899fef942c0b067',
        expectedNoOfQuestions: 15,
        difficultyBreakdown: {
          easy: 5,
          medium: 6,
          hard: 4,
        },
        durationInMinutes: 30,
      },
    ],
  })
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ContestSubjectDto)
  subjects!: ContestSubjectDto[];
}
