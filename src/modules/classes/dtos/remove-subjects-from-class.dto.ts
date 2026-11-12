import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsMongoId, IsNotEmpty } from 'class-validator';

export class RemoveSubjectsFromClassDto {
  @ApiProperty({
    description:
      'Array of subject IDs that needed to be removed from the class.',
    example: ['65a1b2c3d4e5f6789012345a', '65a1b2c3d4e5f6789012345b'],
    type: [String],
  })
  @IsArray({ message: 'Subjects must be an array' })
  @IsNotEmpty({ message: 'Subjects array cannot be empty' })
  @IsMongoId({
    each: true,
    message: 'Each subject ID must be a valid MongoDB ObjectId',
  })
  subjects!: string[];
}
