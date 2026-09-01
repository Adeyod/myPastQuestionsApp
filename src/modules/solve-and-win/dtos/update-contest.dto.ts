import { PartialType } from '@nestjs/mapped-types';
import { CreateSolveAndWinContestDto } from './create-contest.dto';

export class UpdateSolveAndWinContestDto extends PartialType(
  CreateSolveAndWinContestDto,
) {}
