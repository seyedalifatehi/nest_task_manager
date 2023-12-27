import { Controller, Get, Post, Body, Patch, Param, Delete, Request, ForbiddenException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskEntity } from './entities/task.entity';
import { UsersService } from 'src/users/users.service';

@Controller('tasks')
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly usersService: UsersService
  ) {}

  @Post()
  async defineTask(@Request() req, @Body() task: TaskEntity, username: string) {
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
  async showAllTasks() {
    
    return await this.tasksService.showAllTasks();
  }

  @Patch(':taskId')
  update(@Param('taskId') taskId: string, @Body() updateTaskDto: UpdateTaskDto) {
    return this.tasksService.updateTask(taskId, updateTaskDto);
  }

  @Delete(':taskId')
  async removeTask(@Request() req, @Param('taskId') taskId: string) {
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
