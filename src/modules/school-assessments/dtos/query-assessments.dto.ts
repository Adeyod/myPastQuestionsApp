import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsOptional } from 'class-validator';

import { QueryWithPaginationDto } from '../../../common/dto/query-with-pagination';
import {
  AssessmentStatus,
  AssessmentType,
} from '../schemas/school-assessment.schema';

export class QueryAssessmentsDto extends QueryWithPaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  subjectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  classId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  academicSessionId?: string;

  @ApiPropertyOptional({ enum: AssessmentType })
  @IsOptional()
  @IsEnum(AssessmentType)
  assessmentType?: AssessmentType;

  @ApiPropertyOptional({ enum: AssessmentStatus })
  @IsOptional()
  @IsEnum(AssessmentStatus)
  status?: AssessmentStatus;
}
