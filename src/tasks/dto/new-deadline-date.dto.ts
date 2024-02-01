import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsDateString, IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class NewDeadlineDateDto {
  @IsDateString()
  @ApiProperty({
    description: 'the new deadline date of task',
    example: new Date('2024-12-31T00:00:00.000Z'),
  })
  newDeadlineDate: Date;
}
