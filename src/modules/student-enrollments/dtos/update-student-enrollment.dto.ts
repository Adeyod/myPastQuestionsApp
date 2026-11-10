import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class UpdateStudentEnrollmentDto {
  @ApiProperty({
    example: '671a12345678901234567892',
    description: 'ID of the new class the student will be transferred to.',
  })
  @IsMongoId()
  classId!: string;
}
