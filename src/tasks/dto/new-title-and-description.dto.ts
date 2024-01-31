import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class NewTitleAndDescriptionDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'the new title of task',
    example: 'title',
  })
  newTitle: string;

  @ApiProperty({
    description: 'the new description of task',
    example: 'description',
  })
  @IsString()
  newDescription: string;
}
