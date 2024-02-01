import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsDateString, IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class DateRangeDto {
  @IsDateString()
  @ApiProperty({
    description: 'from this date',
    example: new Date('2023-03-10'),
  })
  fromDate: Date;

  @IsDateString()
  @ApiProperty({
    description: 'to this date',
    example: new Date('2023-03-10'),
  })
  toDate: Date;

}
