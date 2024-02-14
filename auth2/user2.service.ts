import { Injectable } from "@nestjs/common";
import { UserDto } from "./user2.dto";

@Injectable()
export class UserService {
  ...,
  async findAndUpdateUser(username: string, updateUserDto: UpdateUserDto): Promise<UserDto> {
    const index = this.users.findIndex((user: UserDto) => user.username === username); 
    return this.users[index] = Object.assign(this.users[index], updateUserDto);
  }
}