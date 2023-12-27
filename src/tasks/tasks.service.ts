import { Injectable } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ArangoRepository, InjectRepository, ResultList } from 'nest-arango';
import { TaskEntity } from './entities/task.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(TaskEntity)
    private readonly taskRepository: ArangoRepository<TaskEntity>,
  ) {}  

  async defineTask(task: TaskEntity, userId: string): Promise<TaskEntity> {
    task.isCompleted = false
    task.userId = userId
    
    return await this.taskRepository.save(task)
  }

  async showAllTasks(): Promise<ResultList<TaskEntity>> {
    return await this.taskRepository.findAll()
  }

  findOne(id: number) {
    return `This action returns a #${id} task`;
  }

  update(id: number, updateTaskDto: UpdateTaskDto) {
    return `This action updates a #${id} task`;
  }

  remove(id: number) {
    return `This action removes a #${id} task`;
  }
}
