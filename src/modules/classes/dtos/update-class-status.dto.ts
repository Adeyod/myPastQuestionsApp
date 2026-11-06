import { IsBoolean } from 'class-validator';

export class UpdateClassStatusDto {
  @IsBoolean()
  isActive!: boolean;
}
