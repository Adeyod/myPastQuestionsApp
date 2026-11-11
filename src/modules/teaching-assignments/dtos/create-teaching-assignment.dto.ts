import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class CreateTeachingAssignmentDto {
  @ApiProperty({
    description: 'School membership ID of the teacher',
  })
  @IsMongoId()
  teacherMembershipId!: string;

  @ApiProperty({
    description: 'ID of the class',
  })
  @IsMongoId()
  classId!: string;

  @ApiProperty({
    description: 'ID of the subject',
  })
  @IsMongoId()
  subjectId!: string;

  @ApiProperty({
    description: 'ID of the academic session',
  })
  @IsMongoId()
  academicSessionId!: string;
}
