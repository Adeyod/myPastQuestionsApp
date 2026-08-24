import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class InjectQuestionsDto {
  @ApiProperty({
    description: 'User access',
  })
  @IsNotEmpty({ message: 'Access User is required' })
  @IsString({ message: 'Access user must be a string' })
  accessUser!: string;
}
