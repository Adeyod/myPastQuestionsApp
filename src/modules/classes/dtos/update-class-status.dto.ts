import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateClassStatusDto {
  @ApiProperty({
    description: 'This shows whether the class is still active or not.',
    example: true,
  })
  @IsBoolean()
  isActive!: boolean;
}
