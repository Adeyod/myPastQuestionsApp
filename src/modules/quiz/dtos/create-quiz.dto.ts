import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { DifficultyBreakdownDto } from '../../solve-and-win/dtos/create-contest.dto';
import { QuizStatus } from '../schemas/quiz.schema';

// export class DifficultyBreakdownDto {
//   @ApiProperty({
//     description: 'This is the number of questions per each difficulty level.',
//     example: 5,
//   })
//   @IsNumber()
//   @Min(1)
//   easy!: number;

//   @ApiProperty({
//     description: 'This is the number of questions per each difficulty level.',
//     example: 3,
//   })
//   @IsNumber()
//   @Min(1)
//   medium!: number;

//   @ApiProperty({
//     description: 'This is the number of questions per each difficulty level.',
//     example: 2,
//   })
//   @IsNumber()
//   @Min(1)
//   hard!: number;
// }

export class RoundInformationDto {
  @ApiProperty({
    description: 'This is the round number.',
    example: 1,
  })
  @IsNumber()
  @Min(1)
  round_number!: number;

  @ApiProperty({
    description: 'This is the number of questions for a particular round.',
    example: 10,
  })
  @IsNumber()
  @Min(1)
  no_of_questions!: number;

  @ApiProperty({
    description:
      'Breakdown of the expected questions by difficulty level for a particular round.',
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

  @ApiProperty({
    description:
      'This is the number of contestants to be eliminated at the end of a particular round.',
    example: 3,
  })
  @IsNumber()
  @Min(1)
  exit_number!: number;

  @ApiProperty({
    description:
      'This is the number of points that will be given to each of the eliminated contestant at the end of a particular round.',
    example: 7,
  })
  @IsNumber()
  @Min(0)
  exit_reward!: number;
}
export class FinalRoundInformationDto {
  @ApiProperty({
    description: 'This is the number of questions for the final round.',
    example: 10,
  })
  @IsNumber()
  @Min(1)
  no_of_questions!: number;

  @ApiProperty({
    description:
      'Breakdown of the expected questions by difficulty level for final round.',
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

  @ApiProperty({
    description: 'This is the reward for the user that become first.',
    example: 100,
  })
  @IsNumber()
  @Min(0)
  first_position_reward!: number;

  @ApiProperty({
    description: 'This is the reward for the user that become second.',
    example: 75,
  })
  @IsNumber()
  @Min(0)
  second_position_reward!: number;
}

export class CreateQuizDto {
  @ApiProperty({
    description: 'This is the title of the quiz.',
    example: 'Biology Elimination Championship',
  })
  @IsString()
  @IsNotEmpty()
  quiz_title!: string;

  @ApiProperty({
    description: 'This is the description of the quiz.',
    example: '20 players enter, 1 champion emerges.',
  })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({
    description: 'This is the ID of the subject that will be done in the quiz.',
    example: '651f8a2e7c9b8d0012a4f5b6',
  })
  @IsMongoId()
  @IsNotEmpty()
  subject!: string;

  @ApiProperty({
    description: 'This is the time for each question in the quiz.',
    example: 20,
  })
  @IsNumber()
  @Min(1)
  time_per_question!: number;

  @ApiProperty({
    description: 'This is the date and start time of the quiz.',
    example: '2026-10-15T18:00:00.000Z',
  })
  @IsDateString()
  start_date!: string;

  @ApiProperty({
    description: 'This is the number of users that will take part in the quiz.',
    example: 15,
  })
  @IsNumber()
  @Min(2)
  no_of_contestants!: number;

  @ApiProperty({
    description: 'This is the number of rounds that the quiz will have.',
    example: 4,
  })
  @IsNumber()
  @Min(2)
  number_of_rounds!: number;

  @ApiProperty({
    description: 'This is the information belonging to each round of the quiz.',
    type: [RoundInformationDto],
    example: [
      {
        round_number: 1,
        no_of_questions: 12,
        difficultyBreakdown: { easy: 8, medium: 4, hard: 0 },
        exit_number: 5,
        exit_reward: 5,
      },
      {
        round_number: 2,
        no_of_questions: 12,
        difficultyBreakdown: { easy: 4, medium: 6, hard: 2 },
        exit_number: 5,
        exit_reward: 10,
      },
      {
        round_number: 3,
        no_of_questions: 12,
        difficultyBreakdown: { easy: 2, medium: 6, hard: 4 },
        exit_number: 4,
        exit_reward: 15,
      },
      {
        round_number: 4,
        no_of_questions: 12,
        difficultyBreakdown: { easy: 0, medium: 4, hard: 8 },
        exit_number: 3,
        exit_reward: 20,
      },
    ],
  })
  @ValidateNested({ each: true })
  @Type(() => RoundInformationDto)
  @ArrayMinSize(1)
  round_information!: RoundInformationDto[];

  @ApiProperty({
    description:
      'This is the information belonging to final round of the quiz.',
    type: FinalRoundInformationDto,
    example: {
      no_of_questions: 10,
      difficultyBreakdown: { easy: 2, medium: 3, hard: 5 },
      first_position_reward: 100,
      second_position_reward: 50,
    },
  })
  @ValidateNested()
  @Type(() => FinalRoundInformationDto)
  final_round_information!: FinalRoundInformationDto;

  @ApiProperty({
    description: 'This is the status of the quiz.',
    example: QuizStatus.DRAFT,
  })
  @IsEnum(QuizStatus)
  status!: QuizStatus;
}
