import { PartialType } from '@nestjs/swagger';
import { CreateSchoolSubjectDto } from './create-subject.dto';

export class UpdateSchoolSubjectDto extends PartialType(
  CreateSchoolSubjectDto,
) {}
