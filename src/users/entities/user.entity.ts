import { Collection, ArangoDocument } from 'nest-arango';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsEmail, IsNotEmpty, IsString } from "class-validator";

@Collection('Users')
export class UserEntity extends ArangoDocument {
    @IsString()
    @ApiProperty({ description: 'user id', example: '1' })
    user_id?: string;

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

    @ApiProperty({ description: 'role', example: 'ADMIN' })
    role: 'ADMIN' | 'SUB_ADMIN' | 'USER';
}
