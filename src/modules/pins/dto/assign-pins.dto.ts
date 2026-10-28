import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsMongoId,
} from 'class-validator';

export class AssignPinsDto {
  @ApiProperty({
    description: 'This is the ID of the vendor selling the PIN',
    example: 'ei3392ue8394jf9550dj49fj',
  })
  @IsMongoId()
  vendorId!: string;

  @ApiProperty({
    description: 'These are the PINs to be sold by the assigned vendor',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @IsMongoId({ each: true })
  pinIds!: string[];
}
