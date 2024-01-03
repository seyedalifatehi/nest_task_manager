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
  async createUser(@Body() user: UserEntity, @Request() req): Promise<UserEntity> {
    return this.usersService.createUser(user, req.user.email);
  }

  @Get()
  @ApiOperation({
    summary: 'گرفتن تمامی کاربران',
  })
  async findAllUsers(@Query('role') role?: 'USER' | 'SUB_ADMIN' | 'ADMIN'): Promise<ResultList<UserEntity>> {
    return this.usersService.findAllUsers(role);
  }

  @Patch('changePassword')
  @ApiOperation({
    summary: 'تغییر رمز کاربر',
  })
  async changePassword (
    @Request() req,
    @Body() passwordData: { oldPassword: string, newPassword: string }
  ): Promise<ArangoNewOldResult<UserEntity>> {
    const currentUser = await this.usersService.findOneUserByEmail(req.user.email);

    if (currentUser.password !== passwordData.oldPassword) {
      throw new ForbiddenException('You entered your old password incorrectly!');
    }

    if (passwordData.newPassword === passwordData.oldPassword) {
      throw new ForbiddenException('This is your current password.');
    }

    return this.usersService.updateUser(currentUser.username, { "password": passwordData.newPassword });
  }

  @Patch('increaseRole/:username')
  @ApiOperation({
    summary: 'افزایش سمت یک کاربر',
  })
  async increaseRole(@Request() req, @Param('username') username: string): Promise<ArangoNewOldResult<UserEntity>> {
    const currentUser = this.usersService.findOneUserByEmail(req.user.email)
    if ((await currentUser).role !== 'ADMIN') {
      throw new ForbiddenException('only admin can increase users roles')
    }
    const wantedUser = this.usersService.findOneUserByUsername(username)
    if ((await wantedUser).role !== 'USER') {
      throw new ForbiddenException('this user\'s role is already increased')
    }

    return this.usersService.updateUser(username, {"role": "SUB_ADMIN"});
  }

  @Patch('decreaseRole/:username')
  @ApiOperation({
    summary: 'کاهش سمت یک کاربر',
  })
  async decreaseRole(@Request() req, @Param('username') username: string): Promise<ArangoNewOldResult<UserEntity>> {
    const currentUser = this.usersService.findOneUserByEmail(req.user.email)
    if ((await currentUser).role !== 'ADMIN') {
      throw new ForbiddenException('only admin can decrease sub admins\' roles')
    }
    const wantedUser = this.usersService.findOneUserByUsername(username)
    if ((await wantedUser).role !== 'SUB_ADMIN') {
      throw new ForbiddenException('you cannot decrease this user\'s role')
    }

    return this.usersService.updateUser(username, {"role": "USER"});
  }

  @Get(':username')
  @ApiOperation({
    summary: 'گرفتن یک کاربر بر اساس نام کاربری اش',
  })
  async findOneUser(@Request() req, @Param('username') username: string): Promise<UserEntity> {
    const currentUser = this.usersService.findOneUserByEmail(req.user.email)
    if ((await currentUser).role === 'USER') {
      throw new ForbiddenException('only admin and sub admins can see users')
    }
    return this.usersService.findOneUserByUsername(username);
  }

  @Delete(':username')
  @ApiOperation({
    summary: 'حذف کاربر',
  })
  async remove(@Request() req, @Param('username') username: string): Promise<void> {
    const currentUser = this.usersService.findOneUserByEmail(req.user.email)
    if ((await currentUser).role !== 'ADMIN') {
      throw new ForbiddenException('only admin can delete users')
    }
    return await this.usersService.removeUser(username);
  }
}
