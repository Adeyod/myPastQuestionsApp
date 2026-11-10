import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

import { StudentEnrollmentStatus } from '../schemas/student-enrollment.schema';

export class UpdateStudentEnrollmentStatusDto {
  @ApiProperty({
    enum: [
      StudentEnrollmentStatus.COMPLETED,
      StudentEnrollmentStatus.WITHDRAWN,
    ],
    example: StudentEnrollmentStatus.WITHDRAWN,
    description: 'New status for the student enrolment.',
  })
  @IsEnum(StudentEnrollmentStatus)
  status!: StudentEnrollmentStatus;
}
