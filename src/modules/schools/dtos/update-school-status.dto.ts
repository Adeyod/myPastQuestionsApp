import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateSchoolStatusDto {
  @ApiProperty({
    description:
      'This is the school status. Needed to change the status of the school.',
    example: true,
  })
  @IsBoolean()
  isActive!: boolean;
}
