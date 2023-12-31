import { Injectable, NotFoundException } from '@nestjs/common';
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
    const definedTask = await this.taskRepository.save(task) 

    return definedTask
  }

  async showTasksOfAdmin(): Promise<ResultList<TaskEntity>> {
    return await this.taskRepository.findManyBy({ role: 'ADMIN' })
  }

  async showTasksOfSubAdmins(): Promise<ResultList<TaskEntity>> {
    return await this.taskRepository.findManyBy({ role: 'SUB_ADMIN' })
  }

  async showTasksOfUsers(): Promise<ResultList<TaskEntity>> {
    return await this.taskRepository.findManyBy({ role: 'USER' })
  }

  async findOneTaskById(_id: string): Promise<TaskEntity | null> {
    return await this.taskRepository.findOneBy({ _id })
  }

  async updateTask(_id: string, updatedTask: Partial<TaskEntity>): Promise<ArangoNewOldResult<TaskEntity>> {
    const wantedTask = await this.taskRepository.findOneBy({ _id })
    if (!wantedTask) {
      throw new NotFoundException('task not found')
    }

    Object.assign(wantedTask, updatedTask)
    const updatedDocument = await this.taskRepository.update(wantedTask)
  
    return updatedDocument ? updatedDocument : null
  }

  async removeTask(_id: string): Promise<void> {
    await this.taskRepository.removeBy({ _id })
  }
}
