import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UserEntity } from './entities/user.entity';
import { AuthGuard } from '../auth/auth.guard';
import { ApiOperation } from '@nestjs/swagger';
import { ResultList } from 'nest-arango';

@UseGuards(AuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({
    summary: 'ثبتنام کاربر توسط ادمین',
  })
  async createUser(@Body() user: UserEntity, @Request() req): Promise<Object> {
    return await this.usersService.createUser(user, req.user.email);
  }

  @Get()
  @ApiOperation({
    summary: 'گرفتن تمامی کاربران',
  })
  async findAllUsers(
    @Query('role') role?: 'USER' | 'SUB_ADMIN' | 'ADMIN',
  ): Promise<ResultList<UserEntity>> {
    return this.usersService.findAllUsers(role);
  }

  @Patch('changePassword')
  @ApiOperation({
    summary: 'تغییر رمز کاربر',
  })
  async changePassword(
    @Request() req,
    @Body() passwordData: { oldPassword: string; newPassword: string },
  ): Promise<Object> {
    return this.usersService.changePassword(
      req.user.email,
      passwordData.oldPassword,
      passwordData.newPassword,
    );
  }

  // this controller changes the role of a user based on his/her current user
  // if user's role is USER, it changrd to SUB_ADMIN
  // and if user's role is SUB_ADMIN, it changrd to USER
  @Patch('changeRole/:username')
  @ApiOperation({
    summary: 'تغییر سمت یک کاربر',
  })
  async changeRole(
    @Request() req,
    @Param('username') username: string,
  ): Promise<Object> {
    return this.usersService.changeRole(req.user.email, username);
  }

  @Patch('editUsername')
  @ApiOperation({
    summary: 'تغییر نام کاربری کاربر کنونی',
  })
  async editUsername(
    @Request() req,
    @Body() newUsernameData: { newUsername: string },
  ): Promise<Object> {
    return await this.usersService.editUsername(
      req.user.email,
      newUsernameData.newUsername,
    );
  }

  @Patch('editEmail')
  @ApiOperation({
    summary: 'تغییر ایمیل کاربر کنونی',
  })
  async editEmail(
    @Request() req,
    @Body() newEmailData: { newEmail: string },
  ): Promise<Object> {
    return await this.usersService.editEmail(
      req.user.email,
      newEmailData.newEmail,
    );
  }

  @Get('findByUsername/:username')
  @ApiOperation({
    summary: 'گرفتن یک کاربر بر اساس نام کاربری اش',
  })
  async findOneUserByUsername(
    @Param('username') username: string,
  ): Promise<Object> {
    const selectedUser =
      await this.usersService.findOneUserByUsername(username);
    return {
      username: selectedUser.username,
      email: selectedUser.email,
      role: selectedUser.role,
    };
  }

  @Delete(':username')
  @ApiOperation({
    summary: 'حذف کاربر',
  })
  async remove(
    @Request() req,
    @Param('username') username: string,
  ): Promise<Object> {
    return await this.usersService.removeUser(username, req.user.email);
  }
}
