import { IsOptional, IsString } from 'class-validator';

export class OptionDto {
  @IsString()
  label!: string;

  @IsString()
  value!: string;

  @IsOptional()
  isCorrect?: boolean;

  @IsOptional()
  explanation?: string;
}
