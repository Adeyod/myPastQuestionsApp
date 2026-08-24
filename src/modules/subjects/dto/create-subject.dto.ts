import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { PlanCode } from '../../plans/schemas/plan.schema';

export class CreateSubjectDto {
  @ApiProperty({
    description: 'Subject name',
    example: 'English',
  })
  @IsNotEmpty({ message: 'Subject name is required' })
  @IsString({ message: 'Subject name is a string' })
  name!: string;

  @ApiProperty({
    description: 'Plan that the subject belong to.',
    example: PlanCode.SECONDARY,
  })
  @IsNotEmpty({ message: 'Plan is required' })
  @IsString({ message: 'Plan is a string' })
  plan!: PlanCode;
}
