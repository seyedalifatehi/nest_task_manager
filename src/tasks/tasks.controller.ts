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
  async create(@Request() req, @Body() task: TaskEntity, username: string) {
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
  findAll() {
    return this.tasksService.showAllTasks();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    return this.tasksService.update(+id, updateTaskDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tasksService.remove(+id);
  }
}
