import {
  BadRequestException,
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

    const currentUser = await this.usersService.findOneUserById(currentUserId);
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

    if (
      !(await this.usersService.userAccessHandleError(currentUser, wantedUser))
    ) {
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
    task.isDeleted = false;

    const definedTask = await this.taskRepository.save(task);

    wantedUser.userTaskIds.push(definedTask._id);
    await this.usersService.updateUser(wantedUser, wantedUser);

    return definedTask;
  }

  async showTasksOfMembers(
    currentUserId: string,
    role: 'USER' | 'SUB_ADMIN',
    startDateRange: Date,
    endDateRange: Date,
  ) {
    if (role == 'SUB_ADMIN') {
      return await this.showTasksOfSubAdmins(
        currentUserId,
        startDateRange,
        endDateRange,
      );
    }

    if (role == 'USER') {
      return await this.showTasksOfUsers(
        currentUserId,
        startDateRange,
        endDateRange,
      );
    } else {
      throw new NotFoundException('role not found');
    }
  }

  // this method returns all tasks of sub admins (in a date range)
  async showTasksOfSubAdmins(
    currentUserId: string,
    startDateRange: Date,
    endDateRange: Date,
  ): Promise<any> {
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
          FILTER (task.defineDate <= ${endDateRange}) && (task.defineDate >= ${startDateRange}) && !task.isDeleted
          RETURN task
    `);

    return await query.all();
  }

  // this method returns all tasks of users (in a date range)
  async showTasksOfUsers(
    currentUserId: string,
    startDateRange: Date,
    endDateRange: Date,
  ): Promise<any> {
    const currentUser = this.usersService.findOneUserById(currentUserId);
    if ((await currentUser).role == 'USER') {
      throw new ForbiddenException(
        'only admin and sub admins can see the tasks of users',
      );
    }

    const cursor = await db.query(aql`
      LET users = (
        FOR user IN Users
          FILTER user.role == 'USER'
          RETURN user
      )

      FOR user IN users
        FOR taskId IN user.userTaskIds
          LET task = DOCUMENT(Tasks, taskId)
          FILTER (task.defineDate <= ${endDateRange}) && (task.defineDate >= ${startDateRange}) && !task.isDeleted
          RETURN task
    `);

    return await cursor.all();
  }

  // this method make isConpleted property of tasks true
  async acceptTask(taskKey: string, currentUserId: string): Promise<any> {
    const currentUser = this.usersService.findOneUserById(currentUserId);
    const wantedTask = await this.findOneTaskById('Tasks/' + taskKey);
    if (wantedTask.isDeleted) {
      throw new BadRequestException('this task is already deleted');
    }

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
    if (wantedTask.isDeleted) {
      throw new BadRequestException('this task is already deleted');
    }

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

  // this method returns a task by an Id
  async findOneTaskById(_id: string): Promise<TaskEntity | null> {
    const foundTask = await this.taskRepository.findOneBy({ _id });
    if (!foundTask) {
      throw new NotFoundException('Task id not found');
    }

    return foundTask;
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

  async changeTitleAndDescription(
    currentUserId: string,
    taskKey: string,
    newTitle: string,
    newDescription: string,
  ) {
    await this.tasksService.changeTitle(taskKey, newTitle, currentUserId);

    await this.tasksService.changeDescription(
      taskKey,
      newDescription,
      currentUserId,
    );

    return {
      message: 'the title and the description of the task changed successfully',
      newTitle: newTitle,
      newDescription: newDescription,
    };
  }

  // this method is used for changing title of a task
  async changeTitle(
    taskKey: string,
    newTitle: string,
    id: string,
  ): Promise<any> {
    const currentUser = await this.usersService.findOneUserById(id);

    const wantedTask = await this.findOneTaskById('Tasks/' + taskKey);

    if (wantedTask.isDeleted) {
      throw new BadRequestException('this task is already deleted');
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
      throw new ForbiddenException('the outdated task cannot be edited');
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

    if (wantedTask.isDeleted) {
      throw new BadRequestException('this task is already deleted');
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
      throw new ForbiddenException('the outdated task cannot be edited');
    }

    return await this.updateTask(wantedTask, { description: newDescription });
  }

  // this method is used for changing description of a task
  async changeDeadlineDate(
    taskKey: string,
    newDeadlineDate: Date,
    id: string,
  ): Promise<any> {
    const currentUser = await this.usersService.findOneUserById(id);

    const wantedTask = await this.findOneTaskById('Tasks/' + taskKey);
    if (wantedTask.isDeleted) {
      throw new BadRequestException('this task is already deleted');
    }

    const username = wantedTask.username;
    const wantedUser = await this.usersService.findOneUserByUsername(username);

    if (
      !(await this.usersService.userAccessHandleError(currentUser, wantedUser))
    ) {
      throw new ForbiddenException(
        'you are not allowed to change the deadline date of this task',
      );
    }

    if (new Date() > new Date(newDeadlineDate)) {
      throw new ForbiddenException(
        'the deadline date cannot be less than today',
      );
    }

    return await this.updateTask(wantedTask, { deadlineDate: newDeadlineDate });
  }

  // this method shows the tasks of the logged in user (in a date range)
  async showEnteredUserTasks(
    currentUserId: string,
    startDateRange: Date,
    endDateRange: Date,
  ): Promise<Array<any>> {
    const userTasks = await db.query(aql`
      LET user = (
        FOR u IN Users
          FILTER u._id == ${currentUserId}
          RETURN u
      )[0]
      
      FILTER user && user.userTaskIds
      FOR taskId IN user.userTaskIds
        LET task = DOCUMENT(Tasks, taskId)
        FILTER task.defineDate <= ${endDateRange} && task.defineDate >= ${startDateRange} && !task.isDeleted
        RETURN task
    `);

    if (!userTasks) {
      throw new ForbiddenException('there is no task for showing');
    }
    return await userTasks.all();
  }

  // this method shows the tasks of the desired in user (in a date range)
  async showDesiredUserTasks(
    currentUserId: string,
    desiredUserUsername: string,
    startDateRange: Date,
    endDateRange: Date,
  ): Promise<Array<any>> {
    const currentUser = await this.usersService.findOneUserById(currentUserId);
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
      const foundTask = await this.findOneTaskById(wantedUser.userTaskIds[i]);
      if (
        foundTask.defineDate >= startDateRange &&
        foundTask.defineDate <= endDateRange &&
        !foundTask.isDeleted
      )
        tasks.push(foundTask);
    }

    console.log(tasks);
    if (tasks.length === 0) {
      throw new ForbiddenException('there is no task for showing');
    }

    return tasks;
  }

  // this method deletes a task (can be recovered)
  async deleteTask(taskKey: string, currentUserId: string): Promise<any> {
    const currentUser = await this.usersService.findOneUserById(currentUserId);

    const wantedTask = await this.findOneTaskById('Tasks/' + taskKey);
    if (wantedTask.isDeleted) {
      throw new BadRequestException('this task is already deleted');
    }

    const username = wantedTask.username;
    const wantedUser = await this.usersService.findOneUserByUsername(username);
    if (
      !(await this.usersService.userAccessHandleError(currentUser, wantedUser))
    ) {
      throw new ForbiddenException(
        'you are not allowed to delete the task of this user',
      );
    }

    return await this.updateTask(wantedTask, { isDeleted: true });
  }

  // this method clears a task
  async clearTask(_id: string, userId: string): Promise<Object> {
    const currentUser = await this.usersService.findOneUserById(userId);

    const wantedTask = await this.findOneTaskById(_id);

    const username = wantedTask.username;
    const wantedUser = await this.usersService.findOneUserByUsername(username);

    if (!wantedTask.isDeleted) {
      throw new ForbiddenException('this task is not deleted yet');
    }

    if (
      !(await this.usersService.userAccessHandleError(currentUser, wantedUser))
    ) {
      throw new ForbiddenException(
        'you are not allowed to clear the task of this user',
      );
    }

    await this.taskRepository.removeBy({ _id });
    const taskIdsArray = wantedUser.userTaskIds;
    taskIdsArray.splice(taskIdsArray.indexOf(_id), 1);
    this.usersService.updateUser(wantedUser, { userTaskIds: taskIdsArray });

    return {
      message: 'task cleared successfully',
    };
  }
}
