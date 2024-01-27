export class Task {}
import { Collection, ArangoDocument } from 'nest-arango';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsBoolean, IsDateString, IsDate } from 'class-validator';

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

  // @IsNotEmpty()
  // @IsString()
  // @ApiProperty({
  //   description: 'the date that the task defined',
  //   example: '1402-01-23',
  // })
  // defineDate: string;

  // @IsNotEmpty()
  // @IsString()
  // @ApiProperty({
  //   description: 'the time that the task defined',
  //   example: '12:00',
  // })
  // defineTime: string;

  // define date and time
  @ApiProperty({
    description: 'the date that the task defined',
    example: new Date('2023-12-31T00:00:00'),
  })
  @IsDate()
  defineDate: Date;

  // --------------------------------------------------------------------

  // @IsNotEmpty()
  // @IsString()
  // @ApiProperty({
  //   description: 'the deadline date of the task',
  //   example: '1402-01-23',
  // })
  // deadlineDate: string;

  // @IsNotEmpty()
  // @IsString()
  // @ApiProperty({
  //   description: 'the deadline time of the task',
  //   example: '12:00',
  // })
  // deadlineTime: string;

  // deadline date and time
  @ApiProperty({
    description: 'the deadline date of the task',
    example: new Date('2023-12-31T00:00:00'),
  })
  @IsDate()
  deadlineDate: Date;
  
}
