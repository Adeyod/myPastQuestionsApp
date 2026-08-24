import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdatePlanDto {
  @ApiPropertyOptional({
    description: 'This is the label of the plan.',
    example: 'Secondary',
  })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional({
    description: 'This is description about the plan.',
    example: 'For secondary school exams and subject practice.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'This describe whether the plan is premium or not.',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isPremium?: boolean;

  @ApiPropertyOptional({
    description: 'This is the amount that we are charging for the plan.',
    example: 5000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceInKobo?: number;

  @ApiPropertyOptional({
    description:
      'This is the status of the plan whether it is still active or not.',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
