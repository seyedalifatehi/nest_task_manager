// this dto doesnt have id because arangodb creates the id automatically after we post data
// this dto is used for sending data to 
import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class CreateUserDto {
    @IsEmail()
    @IsNotEmpty()
    @ApiProperty({ description: 'the email of user', example: 'example@example.com' })
    email: string;

    @ApiProperty({ description: 'the password of user', example: 'password' })
    @IsString()
    password: string;
}
