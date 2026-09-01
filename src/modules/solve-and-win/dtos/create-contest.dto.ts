import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
} from 'class-validator';
import { SolveAndWinContestStatus } from '../schemas/solve-and-win-contest.schema';

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
    description: 'End Date',
    example: '2026-05-04',
  })
  @IsDateString()
  endDate!: string;

  @ApiProperty({
    example: [
      '69bd417a74676c09ac65bc56',
      '69bd4ca6b899fef942c0b067',
      '69be2b2c206c0f7de64f0823',
    ],
  })
  @IsArray()
  @IsMongoId({ each: true })
  @IsNotEmpty()
  subjectIds!: string[];
}
