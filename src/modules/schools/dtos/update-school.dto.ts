import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class UpdateSchoolDto {
  @ApiPropertyOptional({
    description: 'Name of the school',
    example: "Christs' School Ado-Ekiti",
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  schoolName?: string;

  @ApiPropertyOptional({
    description: 'Subdomain of the school',
    example: 'csae',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  subDomain?: string;

  @ApiPropertyOptional({
    description: 'Phone number of the school',
    example: '09039283321',
  })
  @IsOptional()
  @IsString()
  schoolPhone?: string;

  @ApiPropertyOptional({
    description: 'The state that the school is located',
    example: 'Ekiti',
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({
    description: 'Town that the school is located',
    example: 'Ado-Ekiti',
  })
  @IsOptional()
  @IsString()
  town?: string;

  @ApiPropertyOptional({
    description: 'Address of the school',
    example: 'No 10 Adebayo Estate.',
  })
  @IsOptional()
  @IsString()
  address?: string;
}
