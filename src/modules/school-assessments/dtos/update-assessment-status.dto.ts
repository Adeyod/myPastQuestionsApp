import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { AssessmentStatus } from '../schemas/school-assessment.schema';

export class UpdateAssessmentStatusDto {
  @ApiProperty({ enum: [AssessmentStatus.ARCHIVED] })
  @IsEnum(AssessmentStatus)
  status!: AssessmentStatus.ARCHIVED;
}
