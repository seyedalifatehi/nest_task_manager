import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserEntity } from './entities/user.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  createUser(@Body() user: UserEntity) {
    return this.usersService.createUser(user);
  }

  @Get()
  findAll(@Query('role') role?: 'USER' | 'SUB_ADMIN' | 'ADMIN') {
    return this.usersService.findAll(role);
  }

  @Get(':username')
  findOneUser(@Param('username') username: string) {
    return this.usersService.findOneUser(username);
  }

  @Patch(':username')
  updateUser(@Param('username') username: string, @Body() updeatedUser: Partial<UserEntity>) {
    return this.usersService.updateUser(username, updeatedUser);
  }

  @Delete(':username')
  removeUser(@Param('username') username: string) {
    return this.usersService.removeUser(username);
  }
}
