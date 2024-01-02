export class Task {}
import { Collection, ArangoDocument } from 'nest-arango';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsBoolean } from "class-validator";

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
    @ApiProperty({ description: 'isCompleted', example: 'true' })
    isCompleted: boolean;
}
