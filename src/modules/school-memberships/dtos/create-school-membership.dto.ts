import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsNotEmpty } from 'class-validator';
import { SchoolRole } from '../schemas/school-membership.schema';

export class CreateSchoolMembershipDto {
  @ApiProperty({
    description: 'This is the ID of the school.',
    example: '20394jfh48392j84th483jw',
  })
  @IsMongoId()
  @IsNotEmpty()
  schoolId!: string;

  @ApiProperty({
    description: 'This is the user ID of the person.',
    example: '20394jfh48392j84th483jw',
  })
  @IsMongoId()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({
    description: 'This is the that the person will have in the school.',
    example: SchoolRole.ADMIN,
  })
  @IsEnum(SchoolRole)
  role!: SchoolRole;
}
