import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateSchoolQuestionStatusDto {
  @ApiProperty()
  @IsBoolean()
  isActive!: boolean;
}
