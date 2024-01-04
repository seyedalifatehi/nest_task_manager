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
  InjectRepository,
  ResultList,
} from 'nest-arango';
import { TaskEntity } from './entities/task.entity';
import { UsersService } from 'src/users/users.service';
import { aql, Database } from 'arangojs';

const db = new Database({
  url: 'http://localhost:8529',
  databaseName: '_system',
  auth: {
    username: 'root',
    password: 'azim1383',
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

  // this method is for defining task
  // admin defines tasks for users and sub admins
  // sub admin defines tasks for users
  async defineTask(
    task: TaskEntity,
    wantedUserUsername: string,
    currentUserEmail: string,
  ): Promise<TaskEntity> {
    const currentUser =
      await this.usersService.findOneUserByEmail(currentUserEmail);
    console.log(currentUser);

    const wantedUser =
      await this.usersService.findOneUserByUsername(wantedUserUsername);
    console.log(wantedUser);

    if (
      wantedUser.username === currentUser.username &&
      wantedUser.role !== 'ADMIN'
    ) {
      throw new ForbiddenException(
        'only admin can define task for him/herself',
      );
    }

    await this.usersService.userAccessHandleError(
      'you are not allowed to define task for this user',
      currentUser,
      wantedUser,
    );

    task.isCompleted = false;
    task.username = wantedUserUsername;
    const definedTask = await this.taskRepository.save(task);

    wantedUser.userTaskIds.push(definedTask._id);
    await this.usersService.updateUser(wantedUser, wantedUser);

    return definedTask;
  }

  // this method returns all tasks of sub admins
  async showTasksOfSubAdmins(currentUserEmail: string): Promise<any> {
    const currentUser = this.usersService.findOneUserByEmail(currentUserEmail);
    if ((await currentUser).role !== 'ADMIN') {
      throw new ForbiddenException(
        'only admin can see the tasks of sub admins',
      );
    }

    const cursor = await db.query(aql`
      LET subAdmins = (
        FOR user IN Users
          FILTER user.role == 'SUB_ADMIN'
          RETURN user
      )

      FOR subAdmin IN subAdmins
        FOR taskId IN subAdmin.userTaskIds
          LET task = DOCUMENT(Tasks, taskId)
          RETURN task
    `);

    return await cursor.all();
  }

  // this method returns all tasks of users
  async showTasksOfUsers(currentUserEmail: string): Promise<any> {
    const currentUser = this.usersService.findOneUserByEmail(currentUserEmail);
    if ((await currentUser).role == 'USER') {
      throw new ForbiddenException(
        'only admin and sub admins can see the tasks of users',
      );
    }

    const cursor = await db.query(aql`
      LET subAdmins = (
        FOR user IN Users
          FILTER user.role == 'USER'
          RETURN user
      )
      FOR subAdmin IN subAdmins
        FOR taskId IN subAdmin.userTaskIds
          LET task = DOCUMENT(Tasks, taskId)
          RETURN task
    `);

    return await cursor.all();
  }

  // this method returns a task by an Id
  async findOneTaskById(_id: string): Promise<TaskEntity | null> {
    return await this.taskRepository.findOneBy({ _id });
  }

  // this method returns all of the tasks
  async findAllTasks(): Promise<ResultList<TaskEntity>> {
    return await this.taskRepository.findAll();
  }

  // this method is used for editing tasks
  async updateTask(
    _id: string,
    updatedTask: Partial<TaskEntity>,
  ): Promise<ArangoNewOldResult<TaskEntity>> {
    const wantedTask = await this.taskRepository.findOneBy({ _id });

    Object.assign(wantedTask, updatedTask);
    const updatedDocument = await this.taskRepository.update(wantedTask);

    return updatedDocument ? updatedDocument : null;
  }

  // this method is used for changing title of a task
  async changeTitle(
    taskId: string,
    newTitle: string,
    email: string,
  ): Promise<ArangoNewOldResult<TaskEntity>> {
    const currentUser = await this.usersService.findOneUserByEmail(email);

    const wantedTask = await this.findOneTaskById(taskId);
    if (!wantedTask) {
      throw new NotFoundException('task not found');
    }

    const username = wantedTask.username;
    const wantedUser = await this.usersService.findOneUserByUsername(username);

    this.usersService.userAccessHandleError(
      'you are not allowed to edit this task',
      currentUser,
      wantedUser,
    );

    return this.updateTask(taskId, { title: newTitle });
  }

  // this method is used for changing description of a task
  async changeDescription(
    taskId: string,
    newDescription: string,
    email: string,
  ): Promise<ArangoNewOldResult<TaskEntity>> {
    const currentUser = await this.usersService.findOneUserByEmail(email);

    const wantedTask = await this.findOneTaskById(taskId);
    if (!wantedTask) {
      throw new NotFoundException('task not found');
    }

    const username = wantedTask.username;
    const wantedUser = await this.usersService.findOneUserByUsername(username);

    this.usersService.userAccessHandleError(
      'you are not allowed to change the properties of this task',
      currentUser,
      wantedUser,
    );

    return this.updateTask(taskId, { description: newDescription });
  }

  // this method shows the tasks of the logged in user
  async showEnteredUserTasks(email: string): Promise<Array<any>> {
    const userTasks = await db.query(aql`
      LET user = (
        FOR u IN Users
          FILTER u.email == ${email}
          RETURN u
      )[0]
      
      IF !user || !user.userTaskIds
        THROW { "errorCode": 403, "errorMessage": "Invalid user or userTaskIds" }
      
      FOR taskId IN user.userTaskIds
        LET task = DOCUMENT(Tasks, taskId)
        RETURN task
    `);

    return userTasks.all();
  }

  // this method shows the tasks of the desired in user
  async showDesiredUserTasks(
    currentUserEmail: string,
    desiredUserUsername: string,
  ): Promise<Array<any>> {
    const currentUser =
      await this.usersService.findOneUserByEmail(currentUserEmail);
    const wantedUser =
      await this.usersService.findOneUserByUsername(desiredUserUsername);

    this.usersService.userAccessHandleError(
      'you are not allowed to see the tasks of this user',
      currentUser,
      wantedUser,
    );

    const userTasks = await db.query(aql`
      LET user = (
        FOR u IN Users
          FILTER u.email == ${desiredUserUsername}
          RETURN u
      )[0]
      
      IF !user || !user.userTaskIds
        THROW { "errorCode": 403, "errorMessage": "Invalid user or userTaskIds" }
      
      FOR taskId IN user.userTaskIds
        LET task = DOCUMENT(Tasks, taskId)
        RETURN task
    `);

    return userTasks.all();
  }

  // this method removes a task
  async removeTask(_id: string, email: string): Promise<void> {
    const currentUser = await this.usersService.findOneUserByEmail(email);
    const wantedTask = await this.findOneTaskById(_id);
    const username = wantedTask.username;
    const wantedUser = await this.usersService.findOneUserByUsername(username);

    this.usersService.userAccessHandleError(
      'you are not allowed to remove the task of this user',
      currentUser,
      wantedUser,
    );

    await this.taskRepository.removeBy({ _id });
    await db.query(aql`
      FOR taskId IN ${wantedUser.userTaskIds}
        FILTER taskId == ${_id}
        REMOVE taskId IN ${wantedUser.userTaskIds}
    `);
  }
}
