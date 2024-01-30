import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class NewEmailDataDto {
  @IsEmail()
  @ApiProperty({
    description: 'the new email of user',
    example: 'example@example.com',
  })
  newEmail: string;
}
