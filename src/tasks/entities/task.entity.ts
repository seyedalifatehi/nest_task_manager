export class Task {}
import { Collection, ArangoDocument } from 'nest-arango';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsBoolean, IsDate, IsDateString } from 'class-validator';

@Collection('Tasks')
export class TaskEntity extends ArangoDocument {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'userId', example: 'user/1111' })
  username: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'title', example: 'example title' })
  title: string;

  @IsString()
  @ApiProperty({ description: 'description', example: 'description' })
  description: string;

  @ApiProperty({ description: 'pending', example: 'true' })
  pending: boolean;

  @ApiProperty({ description: 'isCompleted', example: 'true' })
  isCompleted: boolean;

  // define date and time
  @ApiProperty({
    description: 'the date that the task defined',
    example: new Date('2023-12-31T00:00:00'),
  })
  defineDate: Date;

  // deadline date and time
  @IsNotEmpty()
  @IsDateString()
  @ApiProperty({
    description: 'the deadline date of the task',
    example: new Date('2023-12-31T00:00:00'),
  })
  deadlineDate: Date;
}
