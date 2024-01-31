import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class NewUsernameAndEmailDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'the new email of user',
    example: 'example@example.com',
  })
  newUsername: string;


  @IsEmail()
  @ApiProperty({
    description: 'the new email of user',
    example: 'example@example.com',
  })
  newEmail: string;
}
