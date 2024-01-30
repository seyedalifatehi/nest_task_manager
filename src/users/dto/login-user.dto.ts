import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginUserDto {
  @IsEmail()
  @ApiProperty({
    description: 'the email of user',
    example: 'example@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'the password of user',
    example: 'Password@1234',
  })
  @IsString()
  password: string;
}
