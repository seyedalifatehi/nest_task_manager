import { Controller, Get, Post, Body, Patch, Param, Delete, Request, ForbiddenException, UseGuards, NotFoundException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TaskEntity } from './entities/task.entity';
import { UsersService } from 'src/users/users.service';
import { ResultList } from 'nest-arango';
import { AuthGuard } from 'src/auth/auth.guard';
import { ApiOperation } from '@nestjs/swagger';

@UseGuards(AuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'تعریف کردن تسک',
  })
  async defineTask(
    @Request() req, 
    @Body() taskData: { task: TaskEntity, username: string }
  ): Promise<TaskEntity> {
    return this.tasksService.defineTask(taskData.task, taskData.username, req.user.email)
  }

  @Get('subAdmins')
  @ApiOperation({
    summary: 'نشان دادن تسک های ساب ادمین ها',
  })
  async showTasksOfSubAdmins(@Request() req): Promise<any> {
    return this.tasksService.showTasksOfSubAdmins(req.user.email);
  }

  @Get('users')
  @ApiOperation({
    summary: 'نشان دادن تسک های کاربران عادی',
  })
  async showTasksOfUsers(@Request() req): Promise<any> {
    return this.tasksService.showTasksOfUsers(req.user.email);
  }

  @Patch('changeTitle/:taskId')
  @ApiOperation({
    summary: 'تغییر عنوان یک تسک',
  })
  async changeTitle(@Param('taskId') taskId: string, @Body() newTitle: string) {
    return this.tasksService.updateTask(taskId, { "title": newTitle });
  }

  @Patch('changeDescription/:taskId')
  @ApiOperation({
    summary: 'تغییر توضیحات یک تسک',
  })
  async changeDescription(@Param('taskId') taskId: string, @Body() newDescription: string) {
    return this.tasksService.updateTask(taskId, {"description": newDescription});
  }

  @Delete(':taskId')
  @ApiOperation({
    summary: 'حذف کردن تسک',
  })
  async removeTask(@Request() req, @Param('taskId') taskId: string): Promise<void> {
    return await this.tasksService.removeTask(taskId, req.user.email);
  }
}
