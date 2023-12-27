import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserEntity } from './entities/user.entity';
import { ArangoModule } from 'nest-arango';
import { TaskEntity } from 'src/tasks/entities/task.entity';
import { TasksService } from 'src/tasks/tasks.service';

@Module({
  imports: [
    ArangoModule.forFeature([UserEntity]),
    ArangoModule.forFeature([TaskEntity]),
  ],
  controllers: [UsersController],
  providers: [UsersService, TasksService],
  exports: [UsersService, TasksService],
})
export class UsersModule {}
