import { Collection, ArangoDocument } from 'nest-arango';
import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsEnum, IsNotEmpty, IsString } from 'class-validator';

@Collection('Users')
export class UserEntity extends ArangoDocument {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'username', example: 'john_doe' })
  username: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'password', example: 'john_doe' })
  password: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'email', example: 'example@example.com' })
  email: string;

  @IsEnum(['ADMIN', 'SUB_ADMIN', 'USER'], {
    message: 'The entered role is not valid',
  })
  @ApiProperty({ description: 'role', example: 'ADMIN' })
  role?: 'ADMIN' | 'SUB_ADMIN' | 'USER';

  @ApiProperty({ description: 'the ids of task', example: '[task id]' })
  userTaskIds: string[];

  
  @ApiProperty({ description: 'the path of the users profile photo', example: 'example.jpg' })
  userProfilePhotoPath: string;
}
