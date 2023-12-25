import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

  // we can input a role to find the users with this role
  @Get()
  findAllUsers() {
    return this.usersService.findAllUsers();
  }

  @Get(':id')
  findOneUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOneUser(id);
  }

  @Patch(':id')
  updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.updateUser(+id, updateUserDto);
  }

  @Delete(':id')
  removeUser(@Param('id') id: string) {
    return this.usersService.removeUser(+id);
  }
}
