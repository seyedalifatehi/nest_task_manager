import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserEntity } from './entities/user.entity';
import { AuthGuard } from '../auth/auth.guard';
import { ApiOperation } from '@nestjs/swagger';

@UseGuards(AuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  createUser(@Body() user: UserEntity) {
    return this.usersService.createUser(user);
  }

  @Get()
  findAll(@Request() req, @Query('role') role?: 'USER' | 'SUB_ADMIN' | 'ADMIN') {
    const reqUser = req.user
    if (reqUser.role === 'USER') {
      throw new ForbiddenException('only admin and sub admins can see all the users')
    }
    return this.usersService.findAll(role);
  }

  @Get(':username')
  findOneUser(@Param('username') username: string) {
    return this.usersService.findOneUserByUsername(username);
  }

  @Patch(':username')
  updateUser(@Param('username') username: string, @Body() updeatedUser: Partial<UserEntity>) {
    return this.usersService.updateUser(username, updeatedUser);
  }

  @Delete(':username')
  @ApiOperation({
    summary: 'حذف کاربر',
  })
  async remove(@Param('username') username: string): Promise<void> {
    return await this.usersService.removeUser(username);
  }
}
