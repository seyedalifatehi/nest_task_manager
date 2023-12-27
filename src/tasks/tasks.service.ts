import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ArangoNewOldResult, ArangoRepository, InjectRepository, ResultList } from 'nest-arango';
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

  // async findOne(taskId: string) {

  // }

  async updateTask(_id: string, updatedTask: Partial<TaskEntity>): Promise<ArangoNewOldResult<TaskEntity>> {
    const wantedTask = await this.taskRepository.findOneBy({ _id })
    if (!wantedTask) {
      throw new NotFoundException('task not found')
    }

    Object.assign(wantedTask, updatedTask)
    const updatedDocument = await this.taskRepository.update(wantedTask)
  
    return updatedDocument ? updatedDocument : null
  }

  remove(id: number) {
    return `This action removes a #${id} task`;
  }
}
