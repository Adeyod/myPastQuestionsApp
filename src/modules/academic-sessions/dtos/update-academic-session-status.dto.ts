import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { AcademicSessionStatus } from '../schemas/academic-session.schema';

export class UpdateAcademicSessionStatusDto {
  @ApiProperty({
    enum: AcademicSessionStatus,
    example: AcademicSessionStatus.ACTIVE,
  })
  @IsEnum(AcademicSessionStatus)
  status!: AcademicSessionStatus;
}
