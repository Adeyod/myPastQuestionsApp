// dto/join-quiz.dto.ts
import { IsMongoId, IsNotEmpty } from 'class-validator';

export class JoinQuizDto {
  @IsMongoId()
  @IsNotEmpty()
  quizId!: string;
}

// dto/create-room.dto.ts
export class CreateRoomDto {
  @IsMongoId()
  @IsNotEmpty()
  quizId!: string;
}

// dto/sync-leaderboard.dto.ts
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  Min,
  ValidateNested,
} from 'class-validator';

export class LeaderboardEntryDto {
  @IsMongoId()
  @IsNotEmpty()
  userId!: string;

  @IsInt()
  @Min(0)
  score!: number;

  @IsInt()
  @Min(0)
  timeTakenInSeconds!: number;

  @IsInt()
  @Min(1)
  rank!: number;

  @IsBoolean()
  isEliminated!: boolean;

  @IsBoolean()
  isTied!: boolean;
}

export class SyncLeaderboardDto {
  @IsMongoId()
  @IsNotEmpty()
  quizId!: string;

  @IsInt()
  @Min(1)
  roundNumber!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LeaderboardEntryDto)
  entries!: LeaderboardEntryDto[];
}

// dto/cast-vote.dto.ts
export class CastVoteDto {
  @IsMongoId()
  @IsNotEmpty()
  quizId!: string;

  @IsInt()
  @Min(1)
  roundNumber!: number;

  @IsMongoId()
  @IsNotEmpty()
  votedParticipantId!: string;
}

// dto/tie-breaker-question.dto.ts
export class RequestTieBreakerDto {
  @IsMongoId()
  @IsNotEmpty()
  quizId!: string;

  @IsInt()
  @Min(1)
  roundNumber!: number;
}
