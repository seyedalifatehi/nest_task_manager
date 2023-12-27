import { Controller, Get, Post, Body, Patch, Param, Delete, Request, ForbiddenException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TaskEntity } from './entities/task.entity';
import { UsersService } from 'src/users/users.service';
import { ResultList } from 'nest-arango';

@Controller('tasks')
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly usersService: UsersService
  ) {}

  @Post()
  async defineTask(@Request() req, @Body() task: TaskEntity, username: string): Promise<TaskEntity> {
    const currentUser = this.usersService.findOneUserByEmail(req.user.email)
    const wantedUser = this.usersService.findOneUserByUsername(username)

    if ((await currentUser).role !== 'ADMIN') {
      if ((await currentUser).role !== 'SUB_ADMIN' || (await wantedUser).role !== 'USER') {
        throw new ForbiddenException('you are not allowed to define task for this user')
      }
    }
    
    return this.tasksService.defineTask(task, (await wantedUser)._id);
  }

  @Get()
  async showAllTasks(@Request() req): Promise<ResultList<TaskEntity>> {
    const currentUser = this.usersService.findOneUserByEmail(req.user.email)
    
    if ((await currentUser).role !== 'ADMIN') {
      throw new ForbiddenException('only admin can see all of the tasks')
    }
    return await this.tasksService.showAllTasks();
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
