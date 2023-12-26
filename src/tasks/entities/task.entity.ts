export class Task {}
import { Collection, ArangoDocument } from 'nest-arango';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsEmail, IsNotEmpty, IsString } from "class-validator";

@Collection('Users')
export class UserEntity extends ArangoDocument {
    @IsString()
    @ApiProperty({ description: 'userId', example: 'user/1111' })
    userId: string;

    @IsNotEmpty()
    @IsString()
    @ApiProperty({ description: 'title', example: 'example title' })
    title: string;

    @IsString()
    @ApiProperty({ description: 'description', example: 'description' })
    description: string;
}
