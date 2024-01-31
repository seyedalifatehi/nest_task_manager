import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { ArangoRepository, InjectRepository, ResultList } from 'nest-arango';
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
    currentUserId: string,
  ): Promise<TaskEntity> {
    const date = new Date();

    const currentUser =
      await this.usersService.findOneUserById(currentUserId);
    console.log(currentUser);

    const wantedUser = await this.usersService.findOneUserByUsername(
      task.username,
    );
    console.log(wantedUser);

    if (
      wantedUser.username === currentUser.username &&
      wantedUser.role !== 'ADMIN'
    ) {
      throw new ForbiddenException(
        'only admin can define task for him/herself',
      );
    }

    if (!this.usersService.userAccessHandleError(currentUser, wantedUser)) {
      throw new ForbiddenException(
        'you are not allowed to define task for this user',
      );
    }

    if (date > new Date(task.deadlineDate)) {
      throw new ForbiddenException(
        'the deadline should not be less than today!',
      );
    }

    task.pending = false;
    task.isCompleted = false;
    task.defineDate = date;

    const existingTask = await db.query(aql`
      LET existTask = (
        FOR t IN Tasks
          FILTER t.username == ${task.username} && t.isCompleted == ${task.isCompleted} && t.title == ${task.title} && t.description == ${task.description} && t.deadlineDate == ${task.deadlineDate}
          LIMIT 1
          RETURN t
      )

      RETURN existTask[0]
    `);

    if (await existingTask.next()) {
      throw new ForbiddenException('this task is defined previously');
    }
    const definedTask = await this.taskRepository.save(task);

    wantedUser.userTaskIds.push(definedTask._id);
    await this.usersService.updateUser(wantedUser, wantedUser);

    return definedTask;
  }

  // this method returns all tasks of sub admins
  async showTasksOfSubAdmins(currentUserId: string): Promise<any> {
    const currentUser = this.usersService.findOneUserById(currentUserId);
    if ((await currentUser).role !== 'ADMIN') {
      throw new ForbiddenException(
        'only admin can see the tasks of sub admins',
      );
    }

    const query = await db.query(aql`
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

    return await query.all();
  }

  // this method returns all tasks of users
  async showTasksOfUsers(currentUserId: string): Promise<any> {
    const currentUser = this.usersService.findOneUserById(currentUserId);
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

  // this method make isConpleted property of tasks true
  async acceptTask(taskKey: string, currentUserId: string): Promise<any> {
    const currentUser = this.usersService.findOneUserById(currentUserId);
    const wantedTask = await this.findOneTaskById('Tasks/' + taskKey);
    if ((await currentUser).role !== 'ADMIN') {
      throw new ForbiddenException('only admin can accept tasks');
    }

    if (!wantedTask.pending) {
      throw new ForbiddenException('task should be marked as pending');
    }

    if (wantedTask.isCompleted) {
      throw new ForbiddenException('this task is already accepted');
    }
    return await this.updateTask(wantedTask, { isCompleted: true });
  }

  // this method make pending property of tasks true
  async markAsPendingTask(
    taskKey: string,
    currentUserId: string,
  ): Promise<any> {
    const currentUser = this.usersService.findOneUserById(currentUserId);
    const wantedTask = await this.findOneTaskById('Tasks/' + taskKey);
    if ((await currentUser).username !== wantedTask.username) {
      throw new ForbiddenException(
        'only the user that the task is defined for can make this task pending',
      );
    }

    if (new Date() > new Date(wantedTask.deadlineDate)) {
      throw new ForbiddenException(
        'the outdated task cannot be marked as pending',
      );
    }

    if (wantedTask.pending) {
      throw new ForbiddenException('this task is already marked as pending');
    }
    return await this.updateTask(wantedTask, { pending: true });
  }

  // this method returns all tasks that their deadline date are between a date range
  async showTasksInDateRange(
    fromDate: Date,
    toDate: Date,
    currentUserId: string,
  ): Promise<any> {
    const currentUser =
      await this.usersService.findOneUserById(currentUserId);
    if (currentUser.role === 'USER') {
      throw new ForbiddenException('you can see only your tasks');
    }

    if (currentUser.role === 'SUB_ADMIN') {
      const query = await db.query(aql`
        FOR t IN Tasks
          FOR u IN Users
            FILTER t.username == u.username && u.role == 'USER' && t.deadlineDate >= ${fromDate} && t.deadlineDate <= ${toDate}
            RETURN t
      `);
      return await query.all();
    }

    const query = await db.query(aql`
      FOR t IN Tasks
        FILTER t.deadlineDate >= ${fromDate} && t.deadlineDate <= ${toDate}
        RETURN t
    `);
    return await query.all();
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
    task: TaskEntity,
    updatedTask: Partial<TaskEntity>,
  ): Promise<any> {
    const updatedDocument = await db.query(aql`
      UPDATE ${task} WITH ${updatedTask} IN Tasks
      RETURN NEW
    `);

    return updatedDocument ? updatedDocument.next() : null;
  }

  // this method is used for changing title of a task
  async changeTitle(
    taskKey: string,
    newTitle: string,
    id: string,
  ): Promise<any> {
    const currentUser = await this.usersService.findOneUserById(id);

    const wantedTask = await this.findOneTaskById('Tasks/' + taskKey);
    if (!wantedTask) {
      throw new NotFoundException('task not found');
    }

    const username = wantedTask.username;
    const wantedUser = await this.usersService.findOneUserByUsername(username);

    if (
      !(await this.usersService.userAccessHandleError(currentUser, wantedUser))
    ) {
      throw new ForbiddenException(
        'you are not allowed to change the title of this task',
      );
    }

    if (new Date() > new Date(wantedTask.deadlineDate)) {
      throw new ForbiddenException(
        'the outdated task cannot be marked as pending',
      );
    }

    if (wantedTask.title === newTitle) {
      throw new ForbiddenException("this is this task's current title");
    }

    return await this.updateTask(wantedTask, { title: newTitle });
  }

  // this method is used for changing description of a task
  async changeDescription(
    taskKey: string,
    newDescription: string,
    id: string,
  ): Promise<any> {
    const currentUser = await this.usersService.findOneUserById(id);

    const wantedTask = await this.findOneTaskById('Tasks/' + taskKey);
    if (!wantedTask) {
      throw new NotFoundException('task not found');
    }

    const username = wantedTask.username;
    const wantedUser = await this.usersService.findOneUserByUsername(username);

    if (
      !(await this.usersService.userAccessHandleError(currentUser, wantedUser))
    ) {
      throw new ForbiddenException(
        'you are not allowed to change the description of this task',
      );
    }

    if (new Date() > new Date(wantedTask.deadlineDate)) {
      throw new ForbiddenException(
        'the outdated task cannot be marked as pending',
      );
    }

    if (wantedTask.description === newDescription) {
      throw new ForbiddenException("this is this task's current description");
    }

    return await this.updateTask(wantedTask, { description: newDescription });
  }

  // this method shows the tasks of the logged in user
  async showEnteredUserTasks(id: string): Promise<Array<any>> {
    const userTasks = await db.query(aql`
      LET user = (
        FOR u IN Users
          FILTER u._id == ${id}
          RETURN u
      )[0]
      
      FILTER user && user.userTaskIds
      FOR taskId IN user.userTaskIds
        LET task = DOCUMENT(Tasks, taskId)
        RETURN task
    `);

    if (!userTasks) {
      throw new ForbiddenException('ther is no task for showing');
    }
    return await userTasks.all();
  }

  // this method shows the tasks of the desired in user
  async showDesiredUserTasks(
    currentUserId: string,
    desiredUserUsername: string,
  ): Promise<Array<any>> {
    const currentUser =
      await this.usersService.findOneUserById(currentUserId);
    const wantedUser =
      await this.usersService.findOneUserByUsername(desiredUserUsername);

    if (
      !(await this.usersService.userAccessHandleError(currentUser, wantedUser))
    ) {
      throw new ForbiddenException(
        'you are not allowed to see the tasks of this user',
      );
    }

    const tasks = [];
    for (let i = 0; i < wantedUser.userTaskIds.length; i++) {
      tasks.push(await this.findOneTaskById(wantedUser.userTaskIds[i]));
    }

    console.log(tasks);
    if (tasks.length === 0) {
      throw new ForbiddenException('there is no task for showing');
    }

    return tasks;
  }

  // this method removes a task
  async removeTask(_id: string, userId: string): Promise<Object> {
    const currentUser = await this.usersService.findOneUserById(userId);

    const wantedTask = await this.findOneTaskById(_id);
    if (!wantedTask) {
      throw new NotFoundException('task id not found');
    }

    const username = wantedTask.username;
    const wantedUser = await this.usersService.findOneUserByUsername(username);

    if (!this.usersService.userAccessHandleError(currentUser, wantedUser)) {
      throw new ForbiddenException(
        'you are not allowed to remove the task of this user',
      );
    }

    await this.taskRepository.removeBy({ _id });
    const taskIdsArray = wantedUser.userTaskIds;
    taskIdsArray.splice(taskIdsArray.indexOf(_id), 1);
    this.usersService.updateUser(wantedUser, { userTaskIds: taskIdsArray });

    return {
      message: 'task deleted successfully',
    };
  }
}
