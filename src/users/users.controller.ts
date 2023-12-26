import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserEntity } from './entities/user.entity';
import { AuthGuard } from '../auth/auth.guard';
import { ApiOperation } from '@nestjs/swagger';
import { ArangoNewOldResult, ResultList } from 'nest-arango';

@UseGuards(AuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({
    summary: 'ثبتنام کاربر',
  })
  async createUser(@Body() user: UserEntity): Promise<UserEntity> {
    return this.usersService.createUser(user);
  }

  @Get()
  @ApiOperation({
    summary: 'گرفتن تمامی کاربران',
  })
  async findAll(@Request() req, @Query('role') role?: 'USER' | 'SUB_ADMIN' | 'ADMIN'): Promise<ResultList<UserEntity>> {
    const reqUser = req.user
    if (reqUser.role !== 'USER') {
      // Allow ADMIN and SUB_ADMIN roles to see all users
      return this.usersService.findAll(role);
    } else {
      // For USER role, restrict access to their own data
      throw new ForbiddenException('only admin and sub admins can see all the users ')
    }}

  @Patch('increaseRole/:username')
  @ApiOperation({
    summary: 'افزایش سمت یک کاربر',
  })
  async increaseRole(@Request() req, @Param('username') username: string): Promise<ArangoNewOldResult<UserEntity>> {
    const reqUser = req.user
    if (reqUser.role !== 'ADMIN') {
      throw new ForbiddenException('only admin can increase users roles')
    }
    return this.usersService.updateUser(username, {"role": "SUB_ADMIN"});
  }

  @Get(':username')
  @ApiOperation({
    summary: 'گرفتن یک کاربر بر اساس نام کاربری اش',
  })
  async findOneUser(@Request() req, @Param('username') username: string): Promise<UserEntity> {
    const reqUser = req.user
    if (reqUser.role === 'USER') {
      throw new ForbiddenException('only admin and sub admins can see users')
    }
    return this.usersService.findOneUserByUsername(username);
  }

  @Delete(':username')
  @ApiOperation({
    summary: 'حذف کاربر',
  })
  async remove(@Request() req, @Param('username') username: string): Promise<void> {
    const reqUser = req.user
    if (reqUser.role !== 'ADMIN') {
      throw new ForbiddenException('only admin can delete users')
    }
    return await this.usersService.removeUser(username);
  }
}
