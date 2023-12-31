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
    const currentUser = this.usersService.findOneUserByEmail(req.user.email)
    const wantedUser = this.usersService.findOneUserByUsername(taskData.username)
    if (wantedUser === null) {
      throw new NotFoundException('this username not exists')
    }

    if ((await currentUser).role !== 'ADMIN') {
      if ((await currentUser).role !== 'SUB_ADMIN' || (await wantedUser).role !== 'USER') {
        throw new ForbiddenException('you are not allowed to define task for this user')
      }
    }
    
    return this.tasksService.defineTask(taskData.task, (await wantedUser)._id);
  }

  @Get('admin')
  async showTasksOfAdmin(@Request() req): Promise<ResultList<TaskEntity>> {
    const currentUser = this.usersService.findOneUserByEmail(req.user.email)
    if ((await currentUser).role !== 'ADMIN') {
      throw new ForbiddenException('only admin can see all of the tasks')
    }
    return await this.tasksService.showTasksOfAdmin();
  }

  @Get('subAdmins')
  async showTasksOfSubAdmins(@Request() req): Promise<ResultList<TaskEntity>> {
    const currentUser = this.usersService.findOneUserByEmail(req.user.email)
    if ((await currentUser).role === 'USER') {
      throw new ForbiddenException('only admin and sub admins can see the tasks of sub admins')
    }
    return await this.tasksService.showTasksOfSubAdmins();
  }

  @Get('users')
  async showTasksOfUsers(@Request() req): Promise<ResultList<TaskEntity>> {
    const currentUser = this.usersService.findOneUserByEmail(req.user.email)
    if ((await currentUser).role === 'USER') {
      throw new ForbiddenException('only admin and sub admins can see the tasks of users')
    }
    return await this.tasksService.showTasksOfUsers();
  }

  @Patch(':taskId')
  update(@Param('taskId') taskId: string, @Body() updatedTask: Partial<TaskEntity>) {
    return this.tasksService.updateTask(taskId, updatedTask);
  }

  @Delete(':taskId')
  async removeTask(@Request() req, @Param('taskId') taskId: string): Promise<void> {
    const currentUser = this.usersService.findOneUserByEmail(req.user.email)
    const wantedTask = this.tasksService.findOneTaskById(taskId)
    const userId = (await wantedTask).userId
    const wantedUser = this.usersService.findOneUserById(userId)

    if ((await currentUser).role !== 'ADMIN') {
      if ((await currentUser).role !== 'SUB_ADMIN' || (await wantedUser).role !== 'USER') {
        throw new ForbiddenException('you are not allowed to remove the task of this user')
      }
    }

    return await this.tasksService.removeTask(taskId);
  }
}
