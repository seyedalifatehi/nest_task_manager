import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { TaskEntity } from './entities/task.entity';
import { ArangoModule } from 'nest-arango';
import { UsersModule } from 'src/users/users.module'; // Import UsersModule directly
import { UserEntity } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';

@Module({
  imports: [
    ArangoModule.forFeature([TaskEntity, UserEntity]),
  ],
  controllers: [TasksController],
  providers: [TasksService, UsersService],
})
export class TasksModule {}
