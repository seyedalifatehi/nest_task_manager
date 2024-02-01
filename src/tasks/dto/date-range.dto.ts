import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsDateString, IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class DateRangeDto {
  @IsDateString()
  @ApiProperty({
    description: 'from this date',
    example: new Date('2024-12-31T00:00:00.000Z'),
  })
  fromDate: Date;

  @IsDateString()
  @ApiProperty({
    description: 'to this date',
    example: new Date('2024-12-31T00:00:00.000Z'),
  })
  toDate: Date;

}
