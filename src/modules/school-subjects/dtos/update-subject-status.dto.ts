import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateSchoolSubjectStatusDto {
  @ApiProperty({
    description: 'This shows whether the subject is still active or not.',
    example: true,
  })
  @IsBoolean()
  isActive!: boolean;
}
