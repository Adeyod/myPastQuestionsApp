import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { SchoolRole } from '../schemas/school-membership.schema';

export class UpdateSchoolMembershipRoleDto {
  @ApiProperty({
    description: 'This is the role that the user in person is changing to.',
    example: SchoolRole.TEACHER,
  })
  @IsEnum(SchoolRole)
  role!: SchoolRole;
}
