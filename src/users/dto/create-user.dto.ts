// this dto doesnt have id because we create the id after we receive this data
// this is dto (data transfer object) for the data we receiving in the request
import { IsEnum, IsEmail, IsNotEmpty, IsString } from "class-validator";

export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsEnum(['ADMIN', 'SUB_ADMIN', 'USER'], {
        message: 'The entered role is not valid'
    })
    role: 'ADMIN' | 'SUB_ADMIN' | 'USER';
}
