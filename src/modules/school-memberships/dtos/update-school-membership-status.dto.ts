import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateSchoolMembershipStatusDto {
  @ApiProperty({
    description: 'This is the status that the user wanted to change into.',
    example: true,
  })
  @IsBoolean()
  isActive!: boolean;
}
