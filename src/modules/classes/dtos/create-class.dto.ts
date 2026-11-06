import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateClassDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  className!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message:
      'Class code can only contain letters, numbers, underscores and hyphens.',
  })
  classCode!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
