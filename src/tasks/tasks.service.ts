import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import {
  ArangoNewOldResult,
  ArangoRepository,
  Database,
  InjectRepository,
  ResultList,
} from 'nest-arango';
import { TaskEntity } from './entities/task.entity';
import { UsersService } from 'src/users/users.service';

const db = new Database({
  url: 'http://localhost:8529',
  databaseName: process.env.DB_NAME,
  auth: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
  },
});

@Injectable()
export class TasksService {
  tasksService: any;
  constructor(
    @InjectRepository(TaskEntity)
    private readonly taskRepository: ArangoRepository<TaskEntity>,

    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
  ) {}

  async defineTask(
    task: TaskEntity,
    wantedUsername: string,
    email: string,
  ): Promise<TaskEntity> {
    const currentUser = await this.usersService.findOneUserByEmail(email);
    console.log(currentUser);

    const wantedUser =
      await this.usersService.findOneUserByUsername(wantedUsername);
    console.log(wantedUser);

    if (wantedUser === undefined) {
      throw new NotFoundException('this username not exists');
    }

    if (
      wantedUser.username === currentUser.username &&
      wantedUser.role !== 'ADMIN'
    ) {
      throw new ForbiddenException(
        'only admin can define task for him/herself',
      );
    }

    if (currentUser.role !== 'ADMIN') {
      if (currentUser.role !== 'SUB_ADMIN' || wantedUser.role !== 'USER') {
        throw new ForbiddenException(
          'you are not allowed to define task for this user',
        );
      }
    }

    task.isCompleted = false;
    task.username = wantedUsername;
    const definedTask = await this.taskRepository.save(task);

    wantedUser.userTaskIds.push(definedTask._id);
    await this.usersService.updateUser(wantedUser.username, wantedUser);

    return definedTask;
  }

  async findOneTaskById(_id: string): Promise<TaskEntity | null> {
    return await this.taskRepository.findOneBy({ _id });
  }

  async findAllTasks(): Promise<ResultList<TaskEntity>> {
    return await this.taskRepository.findAll();
  }

  async updateTask(
    _id: string,
    updatedTask: Partial<TaskEntity>,
  ): Promise<ArangoNewOldResult<TaskEntity>> {
    const wantedTask = await this.taskRepository.findOneBy({ _id });
    if (!wantedTask) {
      throw new NotFoundException('task not found');
    }

    Object.assign(wantedTask, updatedTask);
    const updatedDocument = await this.taskRepository.update(wantedTask);

    return updatedDocument ? updatedDocument : null;
  }

  async removeTask(_id: string): Promise<void> {
    await this.taskRepository.removeBy({ _id });
  }
}
