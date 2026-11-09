import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { AcademicPeriodStatus } from '../schemas/academic-period.schema';

export class UpdateAcademicPeriodStatusDto {
  @ApiProperty({
    enum: AcademicPeriodStatus,
    example: AcademicPeriodStatus.ACTIVE,
  })
  @IsEnum(AcademicPeriodStatus)
  status!: AcademicPeriodStatus;
}
