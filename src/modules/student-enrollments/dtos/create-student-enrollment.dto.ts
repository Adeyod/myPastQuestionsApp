import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class CreateStudentEnrollmentDto {
  @ApiProperty({
    example: '671a12345678901234567890',
    description: 'ID of the student school membership.',
  })
  @IsMongoId()
  schoolMembershipId!: string;

  @ApiProperty({
    example: '671a12345678901234567891',
    description: 'ID of the class the student will be enrolled in.',
  })
  @IsMongoId()
  classId!: string;
}
