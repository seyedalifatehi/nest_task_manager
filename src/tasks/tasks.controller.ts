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
    @Body() dateRangeDto: DateRangeDto,
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
    await this.tasksService.changeTitle(
      taskKey,
      newTitleAndDescriptionDto.newTitle,
      req.user._id,
    );

    await this.tasksService.changeDescription(
      taskKey,
      newTitleAndDescriptionDto.newDescription,
      req.user._id,
    );

    return {
      message: 'the title and the description of the task changed successfully',
      newTitle: newTitleAndDescriptionDto.newTitle,
      newDescription: newTitleAndDescriptionDto.newDescription,
    };
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
    @Body() dateRangeDto: DateRangeDto,
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
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        fromDate: {
          type: 'string',
          format: 'date',
        },
        toDate: {
          type: 'string',
          format: 'date',
        },
      },
    },
  })
  async showDesiredUserTasks(
    @Request() req,
    @Param('username') desiredUserUsername: string,
    @Body() dateRangeDto: DateRangeDto,
  ) {
    return await this.tasksService.showDesiredUserTasks(
      req.user._id,
      desiredUserUsername,
      dateRangeDto.startDateRange,
      dateRangeDto.endDateRange,
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
    return await this.tasksService.removeTask('Tasks/' + taskKey, req.user._id);
  }
}
