import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TaskEntity } from './entities/task.entity';
import { AuthGuard } from 'src/auth/auth.guard';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({
    summary: 'تعریف کردن تسک',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
        },
        description: {
          type: 'string',
        },
        deadlineDate: {
          type: 'string',
        },
        username: {
          type: 'string',
        },
      },
    },
  })
  async defineTask(
    @Body() task: TaskEntity,
    @Request() req,
  ): Promise<TaskEntity> {
    return await this.tasksService.defineTask(task, req.user.email);
  }

  @Get('subAdmins')
  @ApiOperation({
    summary: 'نشان دادن تسک های دستیاران ادمین',
  })
  async showTasksOfSubAdmins(@Request() req): Promise<any> {
    return await this.tasksService.showTasksOfSubAdmins(req.user.email);
  }

  @Get('users')
  @ApiOperation({
    summary: 'نشان دادن تسک های کاربران عادی',
  })
  async showTasksOfUsers(@Request() req): Promise<any> {
    return await this.tasksService.showTasksOfUsers(req.user.email);
  }

  @Patch('changeTitle/:taskKey')
  @ApiOperation({
    summary: 'تغییر عنوان یک تسک',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        newTitle: {
          type: 'string',
        },
      },
    },
  })
  async changeTitle(
    @Param('taskKey') taskKey: string,
    @Body() newTitleData: { newTitle: string },
    @Request() req,
  ) {
    return await this.tasksService.changeTitle(
      taskKey,
      newTitleData.newTitle,
      req.user.email,
    );
  }

  @Patch('changeDescription/:taskKey')
  @ApiOperation({
    summary: 'تغییر توضیحات یک تسک',
  })
  async changeDescription(
    @Param('taskKey') taskKey: string,
    @Body() newDescriptionData: { newDescription: string },
    @Request() req,
  ) {
    return await this.tasksService.changeDescription(
      taskKey,
      newDescriptionData.newDescription,
      req.user.email,
    );
  }

  @Patch('pendingTask/:taskKey')
  @ApiOperation({
    summary: 'علامت گذاری تسک به عنوان در حال بررسی توسط ادمین',
  })
  async markAsPendingTask(@Param('taskKey') taskKey: string, @Request() req) {
    return await this.tasksService.acceptTask(taskKey, req.user.email);
  }

  @Patch('acceptTask/:taskKey')
  @ApiOperation({
    summary: 'قبول کردن تسک',
  })
  async acceptTask(@Param('taskKey') taskKey: string, @Request() req) {
    return await this.tasksService.acceptTask(taskKey, req.user.email);
  }

  @Get('showEnteredUserTasks')
  @ApiOperation({
    summary: 'نشان دادن تسک های کاربر وارد شده',
  })
  async showEnteredUserTasks(@Request() req) {
    return await this.tasksService.showEnteredUserTasks(req.user.email);
  }

  @Get('showDesiredUserTasks/:username')
  @ApiOperation({
    summary: 'نشان دادن تسک های کاربر دلخواه',
  })
  async showDesiredUserTasks(
    @Request() req,
    @Param('username') desiredUserUsername: string,
  ) {
    return await this.tasksService.showDesiredUserTasks(
      req.user.email,
      desiredUserUsername,
    );
  }

  @Get('showTasksInDateRange')
  @ApiOperation({
    summary:
      'نشان دادن تسک هایی که مهلت تحویلشان در یک بازه تاریخ مشخص شده هستند',
  })
  async showTasksInDateRange(
    @Body() dateRange: { fromDate: Date; toDate: Date },
    @Request() req,
  ) {
    return await this.tasksService.showTasksInDateRange(
      dateRange.fromDate,
      dateRange.toDate,
      req.user.email,
    );
  }

  @Delete(':taskKey')
  @ApiOperation({
    summary: 'حذف کردن تسک',
  })
  async removeTask(
    @Request() req,
    @Param('taskKey') taskKey: string,
  ): Promise<Object> {
    return await this.tasksService.removeTask(
      'Tasks/' + taskKey,
      req.user.email,
    );
  }
}
