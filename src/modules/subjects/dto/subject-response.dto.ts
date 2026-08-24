import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { PlanCode } from '../../plans/schemas/plan.schema';

export class SubjectResponseDto {
  @ApiProperty({
    description: 'Subject ID',
    example: '69bd417a74676c09ac65bc56',
  })
  _id!: Types.ObjectId;

  @ApiProperty({
    description: 'Subject Name',
    example: 'english',
  })
  name!: string;

  @ApiProperty({
    description: 'Plan that the subject belong to',
    example: [PlanCode.SECONDARY, PlanCode.TERTIARY],
  })
  plans!: [PlanCode];
}
