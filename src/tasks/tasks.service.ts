import { Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { ArangoNewOldResult, ArangoRepository, Database, InjectRepository, ResultList } from 'nest-arango';
import { TaskEntity } from './entities/task.entity';
import { UsersService } from 'src/users/users.service';


const db = new Database({
  url: "http://localhost:8529",
  databaseName: process.env.DB_NAME,
  auth: { username: process.env.DB_USERNAME, password: process.env.DB_PASSWORD },
});

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(TaskEntity)
    private readonly taskRepository: ArangoRepository<TaskEntity>,

    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
  ) {}  

  async defineTask(task: TaskEntity, username: string): Promise<TaskEntity> {
    task.isCompleted = false
    task.username = username
    const definedTask = await this.taskRepository.save(task) 

    return definedTask
  }

  async findOneTaskById(_id: string): Promise<TaskEntity | null> {
    return await this.taskRepository.findOneBy({ _id })
  }

  async findAllTasks(): Promise<ResultList<TaskEntity>> {
    return await this.taskRepository.findAll()
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
