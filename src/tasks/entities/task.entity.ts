export class Task {}
import { Collection, ArangoDocument } from 'nest-arango';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsBoolean } from 'class-validator';

@Collection('Tasks')
export class TaskEntity extends ArangoDocument {
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

  @IsBoolean()
  @ApiProperty({ description: 'pending', example: 'true' })
  pending: boolean;

  @IsBoolean()
  @ApiProperty({ description: 'isCompleted', example: 'true' })
  isCompleted: boolean;

  // define date and time
  @IsString()
  @ApiProperty({
    description: 'the date that the task defined',
    example: '1402-01-23',
  })
  defineDate: string;

  @IsString()
  @ApiProperty({
    description: 'the time that the task defined',
    example: '12:00',
  })
  defineTime: string;

  // deadline date and time
  @IsString()
  @ApiProperty({
    description: 'the deadline date of the task',
    example: '1402-01-23',
  })
  deadlineDate: string;

  @IsString()
  @ApiProperty({
    description: 'the deadline time of the task',
    example: '12:00',
  })
  deadlineTime: string;
}
