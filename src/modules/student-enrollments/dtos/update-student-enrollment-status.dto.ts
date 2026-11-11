import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

import { ClassStudentEnrollmentStatus } from '../schemas/student-enrollment.schema';

export class UpdateStudentEnrollmentStatusDto {
  @ApiProperty({
    enum: [
      ClassStudentEnrollmentStatus.COMPLETED,
      ClassStudentEnrollmentStatus.WITHDRAWN,
    ],
    example: ClassStudentEnrollmentStatus.WITHDRAWN,
    description: 'New status for the student enrolment.',
  })
  @IsEnum(ClassStudentEnrollmentStatus)
  status!: ClassStudentEnrollmentStatus;
}
