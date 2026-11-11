import { PartialType } from '@nestjs/swagger';
import { CreateTeachingAssignmentDto } from './create-teaching-assignment.dto';

export class UpdateTeachingAssignmentDto extends PartialType(
  CreateTeachingAssignmentDto,
) {}
