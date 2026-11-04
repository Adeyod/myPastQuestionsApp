import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { AccessMode } from '../schemas/schools.schema';

export class CreateSchoolDto {
  @ApiProperty({
    description: 'Name of the school',
    example: "Christs' School Ado-Ekiti",
  })
  @IsNotEmpty({ message: 'School name is required.' })
  @IsString({ message: 'School name is a string' })
  @MinLength(3)
  schoolName!: string;

  @ApiProperty({
    description: 'Subdomain of the school',
    example: 'csae',
  })
  @IsNotEmpty({ message: 'School Subdomain is required.' })
  @IsString({ message: 'School Subdomain is a string' })
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message:
      'Subdomain can contain lowercase letters, numbers and hyphens only',
  })
  @MaxLength(6, { message: 'Subdomain can only be maximum of 6 in length.' })
  subDomain!: string;

  @ApiProperty({
    description: 'Email of the school',
    example: 'christsschooladoekiti@gmail.com',
  })
  @IsNotEmpty({ message: 'School email is required.' })
  @IsString({ message: 'School email is a string' })
  @IsEmail({}, { message: 'Invalid email address' })
  schoolEmail!: string;

  @ApiProperty({
    description: 'Phone number of the school',
    example: '09039283321',
  })
  @IsNotEmpty({ message: 'School phone number is required.' })
  @IsString({ message: 'School phone number is a string' })
  schoolPhone!: string;

  @ApiProperty({
    description: 'The state that the school is located',
    example: 'Ekiti',
  })
  @IsNotEmpty({ message: 'School state is required.' })
  @IsString({ message: 'School state is a string' })
  state!: string;

  @ApiProperty({
    description: 'Town that the school is located',
    example: 'Ado-Ekiti',
  })
  @IsNotEmpty({ message: 'School town is required.' })
  @IsString({ message: 'School town is a string' })
  town!: string;

  @ApiProperty({
    description: 'Address of the school',
    example: 'No 10 Adebayo Estate.',
  })
  @IsNotEmpty({ message: 'School address is required.' })
  @IsString({ message: 'School address is a string' })
  address!: string;

  @ApiProperty({
    description:
      'Access mode. Whether school is using yearly subscription or student pin to access their school platform.',
    example: AccessMode.STUDENT_PIN,
  })
  @IsNotEmpty({ message: 'Access mode is required.' })
  @IsEnum(AccessMode)
  accessMode!: AccessMode;

  @ApiProperty({
    description:
      'This is the first name of the school owner which is going to be used to generate user account for the school owner.',
    example: 'Ade',
  })
  @IsString({ message: 'Owner first name is a string' })
  @IsNotEmpty({ message: 'Owner first name is required.' })
  ownerFirstName!: string;

  @ApiProperty({
    description:
      'This is the last name of the school owner which is going to be used to generate user account for the school owner.',
    example: 'Ade',
  })
  @IsString({ message: 'Owner last name is a string' })
  @IsNotEmpty({ message: 'Owner last name is required.' })
  ownerLastName!: string;

  @ApiProperty({
    description:
      'This is the email of the school owner which is going to be used to generate user account for the school owner.',
    example: 'schoolowner@example.com',
  })
  @IsEmail({}, { message: 'Invalid email address' })
  ownerEmail!: string;

  @ApiProperty({
    description: 'Phone number of the school owner',
    example: '09039283321',
  })
  @IsNotEmpty({ message: 'School owner phone number is required.' })
  @IsString({ message: 'School owner phone number is a string' })
  ownerPhoneNumber!: string;

  @ApiProperty({ description: 'User password', example: 'StrongP@ssword1' })
  @IsNotEmpty({ message: 'Password is required.' })
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be minimum of 8 characters long.' })
  @MaxLength(32, {
    message: 'Password can not be more than 32 characters long.',
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  ownerTemporaryPassword!: string;
}
