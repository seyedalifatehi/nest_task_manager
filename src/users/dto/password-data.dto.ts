// this dto doesnt have id because arangodb creates the id automatically after we post data
// this dto is used for sending data to
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
} from 'class-validator';

export class PasswordDataDto {
  @ApiProperty({
    description: 'the old password of user',
    example: 'Password@1234',
  })
  @IsString()
  oldPassword: string;

  @ApiProperty({
    description: 'the new password of user',
    example: 'Password@1234',
  })
  @IsStrongPassword()
  @IsString()
  newPassword: string;
}
