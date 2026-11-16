import { PartialType } from '@nestjs/swagger';
import { CreateSchoolQuestionsDto } from './create-question.dto';

export class UpdateSchoolQuestionDto extends PartialType(
  CreateSchoolQuestionsDto,
) {}
