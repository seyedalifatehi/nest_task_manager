import { Controller, Get, Post, Body, Patch, Param, Delete, Request, ForbiddenException, UseGuards, NotFoundException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TaskEntity } from './entities/task.entity';
import { UsersService } from 'src/users/users.service';
import { ResultList } from 'nest-arango';
import { AuthGuard } from 'src/auth/auth.guard';

@UseGuards(AuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly usersService: UsersService
  ) {}

  @Post()
  async defineTask(
    @Request() req, 
    @Body() taskData: { task: TaskEntity, username: string }
  ): Promise<TaskEntity> {
    return this.tasksService.defineTask(taskData.task, taskData.username, req.user.email)
  }

  @Get('subAdmins')
  async showTasksOfSubAdmins(@Request() req): Promise<any> {
    return this.tasksService.showTasksOfSubAdmins(req.user.email);
  }

  @Get('users')
  async showTasksOfUsers(@Request() req): Promise<any> {
    return this.tasksService.showTasksOfUsers(req.user.email);
  }

  @Patch(':taskId')
  update(@Param('taskId') taskId: string, @Body() updatedTask: Partial<TaskEntity>) {
    return this.tasksService.updateTask(taskId, updatedTask);
  }

  @Delete(':taskId')
  async removeTask(@Request() req, @Param('taskId') taskId: string): Promise<void> {
    return await this.tasksService.removeTask(taskId, req.user.email);
  }
}
