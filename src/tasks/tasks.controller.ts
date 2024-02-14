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
  Query,
  NotFoundException,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TaskEntity } from './entities/task.entity';
import { AuthGuard } from 'src/auth/auth.guard';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { NewTitleAndDescriptionDto } from './dto/new-title-and-description.dto';
import { NewDeadlineDateDto } from './dto/new-deadline-date.dto';
import { DateRangeDto } from './dto/date-range.dto';

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
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
    return await this.tasksService.defineTask(task, req.user._id);
  }

  @Get('showTasksOfMembers')
  @ApiOperation({
    summary: 'نشان دادن تسک های دستیاران ادمین یا کاربران عادی',
  })
  @ApiQuery({
    name: 'role',
    enum: ['USER', 'SUB_ADMIN'],
  })
  async showTasksOfMembers(
    @Request() req,
    @Query('role') role: 'USER' | 'SUB_ADMIN',
    @Query() dateRangeDto: DateRangeDto,
  ): Promise<any> {
    return await this.tasksService.showTasksOfMembers(
      req.user._id,
      role,
      dateRangeDto.startDateRange,
      dateRangeDto.endDateRange,
    );
  }

  @Patch('changeTitleAndDescription/:taskKey')
  @ApiOperation({
    summary: 'تغییر توضیحات و عنوان یک تسک',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        newTitle: {
          type: 'string',
        },
        newDescription: {
          type: 'string',
        },
      },
    },
  })
  async changeTitleAndDescription(
    @Param('taskKey') taskKey: string,
    @Body() newTitleAndDescriptionDto: NewTitleAndDescriptionDto,
    @Request() req,
  ) {
    return await this.tasksService.changeTitleAndDescription(
      req.user._id,
      taskKey,
      newTitleAndDescriptionDto.newTitle,
      newTitleAndDescriptionDto.newDescription,
    );
  }

  @Patch('changeDeadlineDate/:taskKey')
  @ApiOperation({
    summary: 'تغییر زمان تحویل یک تسک',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        newDeadlineDate: {
          type: 'string',
          format: 'date',
        },
      },
    },
  })
  async changeDeadlineDate(
    @Param('taskKey') taskKey: string,
    @Body() newDeadlineDate: NewDeadlineDateDto,
    @Request() req,
  ) {
    await this.tasksService.changeDeadlineDate(
      taskKey,
      newDeadlineDate.newDeadlineDate,
      req.user._id,
    );

    return {
      message: 'task deadline changed successfully',
      newDeadlineDate: newDeadlineDate.newDeadlineDate,
    };
  }

  @Patch('pendingTask/:taskKey')
  @ApiOperation({
    summary: 'علامت گذاری تسک به عنوان در حال بررسی توسط ادمین',
  })
  async markAsPendingTask(@Param('taskKey') taskKey: string, @Request() req) {
    return await this.tasksService.markAsPendingTask(taskKey, req.user._id);
  }

  @Patch('acceptTask/:taskKey')
  @ApiOperation({
    summary: 'قبول کردن تسک',
  })
  async acceptTask(@Param('taskKey') taskKey: string, @Request() req) {
    return await this.tasksService.acceptTask(taskKey, req.user._id);
  }

  @Get('showEnteredUserTasks')
  @ApiOperation({
    summary: 'نشان دادن تسک های کاربر وارد شده',
  })
  async showEnteredUserTasks(
    @Request() req,
    @Query() dateRangeDto: DateRangeDto,
  ) {
    return await this.tasksService.showEnteredUserTasks(
      req.user._id,
      dateRangeDto.startDateRange,
      dateRangeDto.startDateRange,
    );
  }

  @Get('showDesiredUserTasks/:username')
  @ApiOperation({
    summary: 'نشان دادن تسک های کاربر دلخواه',
  })
  async showDesiredUserTasks(
    @Request() req,
    @Param('username') desiredUserUsername: string,
    @Query() dateRangeDto: DateRangeDto,
  ) {
    return await this.tasksService.showDesiredUserTasks(
      req.user._id,
      desiredUserUsername,
      dateRangeDto.startDateRange,
      dateRangeDto.endDateRange,
    );
  }

  @Delete('deleteTask/:taskKey')
  @ApiOperation({
    summary: 'علامت گذاری تسک به عنوان حذف شده (می تواند بازنشانی شود)',
  })
  async deleteTask(
    @Request() req,
    @Param('taskKey') taskKey: string,
  ): Promise<Object> {
    return await this.tasksService.deleteTask('Tasks/' + taskKey, req.user._id);
  }

  @Patch('recoverTask/:taskKey')
  @ApiOperation({
    summary: 'بازنشانی تسک',
  })
  async recoverTask(@Param('taskKey') taskKey: string, @Request() req) {
    return await this.tasksService.recoverTask(taskKey, req.user._id);
  }

  @Patch('recoverAllTasks')
  @ApiOperation({
    summary: 'بازنشانی تمامی تسک ها',
  })
  async recoverAllTasks(@Request() req) {
    return await this.tasksService.recoverAllTasks(req.user._id);
  }

  @Delete('clearTask/:taskKey')
  @ApiOperation({
    summary: 'حذف کردن تسک از دیتابیس',
  })
  async clearTask(
    @Request() req,
    @Param('taskKey') taskKey: string,
  ): Promise<Object> {
    return await this.tasksService.clearTask('Tasks/' + taskKey, req.user._id);
  }

  @Delete('clearAllTasks')
  @ApiOperation({
    summary: 'حذف کردن تسک های علامت گداری شده از دیتابیس',
  })
  async clearAllTasks(@Request() req): Promise<Object> {
    return await this.tasksService.clearAllTasks(req.user._id);
  }
}
