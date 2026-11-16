import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
} from 'class-validator';
import { QueryWithPaginationDto } from '../../../common/dto/query-with-pagination';
import {
  SchoolQuestionDifficulty,
  SchoolQuestionType,
} from '../schemas/school-question.schema';

export class QuerySchoolQuestionsDto extends QueryWithPaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  classId?: string;

  @ApiPropertyOptional({ enum: SchoolQuestionType })
  @IsOptional()
  @IsEnum(SchoolQuestionType)
  questionType?: SchoolQuestionType;

  @ApiPropertyOptional({ enum: SchoolQuestionDifficulty })
  @IsOptional()
  @IsEnum(SchoolQuestionDifficulty)
  difficulty?: SchoolQuestionDifficulty;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  topic?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  isActive?: boolean;
}
