import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { TaskEntity } from './entities/task.entity';
import { ArangoModule } from 'nest-arango';
import { UsersModule } from 'src/users/users.module'; // Import UsersModule directly

@Module({
  imports: [
    ArangoModule.forFeature([TaskEntity]),
    UsersModule, // Import UsersModule directly
  ],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
