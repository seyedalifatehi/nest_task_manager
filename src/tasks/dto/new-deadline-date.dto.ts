import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsDateString, IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class NewDeadlineDateDto {
  @IsDateString()
  @ApiProperty({
    description: 'the new title of task',
    example: new Date('2023-03-10'),
  })
  newDeadlineDate: Date;
}
