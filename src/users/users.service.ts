import { ForbiddenException, Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import {
  InjectRepository,
  ArangoRepository,
  ResultList,
  ArangoNewOldResult,
} from 'nest-arango';
import { UserEntity } from './entities/user.entity';
import { TaskEntity } from 'src/tasks/entities/task.entity';
import { TasksService } from 'src/tasks/tasks.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: ArangoRepository<UserEntity>,
    
    @Inject(forwardRef(() => TasksService))
    private readonly taskService: TasksService,
    ) {}  

  async createUser(user: UserEntity): Promise<UserEntity> {
    const users = this.userRepository.findAll()
    for (let i = 0; i < (await users).totalCount; i++) {
      if ((await users).results[i].email === user.email) {
        throw new ForbiddenException('this email already exists')
      }

      if ((await users).results[i].username === user.username) {
        throw new ForbiddenException('this username already exists')
      }
    }
    
    user.role = 'USER'
    user.userTaskIds = []
    // user.userTaskIds.pop()
    return await this.userRepository.save(user);
  }

  async findAllUsers(role?: 'USER' | 'SUB_ADMIN' | 'ADMIN'): Promise<ResultList<UserEntity>> {
    if (role) {
      const rolesArray = this.userRepository.findManyBy({ role });
      if ((await rolesArray).results.length === 0) {
          throw new NotFoundException('User Role Not Found')
      }
      return rolesArray;
    }
    
    return await this.userRepository.findAll();
  }

  async findOneUserByEmail(email: string): Promise<UserEntity | null> {
    return await this.userRepository.findOneBy({ email })
  }

  async findOneUserByUsername(username: string): Promise<UserEntity | null> {
    return await this.userRepository.findOneBy({ username })
  }

  async findOneUserById(_id: string): Promise<UserEntity | null> {
    return await this.userRepository.findOneBy({ _id })
  }

  async showUsersTasks(user: UserEntity): Promise<Array<TaskEntity>> {
    // Check if user and userTaskIds are defined
    if (!user || !user.userTaskIds) {
      // Handle the case where user or userTaskIds is undefined
      // Throw an error, return an empty array, or handle it accordingly
      throw new ForbiddenException('Invalid user or userTaskIds');
    }
  
    // Initialize tasks array
    let tasks: TaskEntity[] = [];
  
    // Loop through userTaskIds
    for (let i = 0; i < user.userTaskIds.length; i++) {
      // Ensure taskService and findOneTaskById are properly defined
      const task = await this.taskService.findOneTaskById(user.userTaskIds[i]);
      tasks.push(task);
    }
  
    return tasks;
  }
  

  async updateUser(
    username: string,
    updatedUser: Partial<UserEntity>
    ): Promise<ArangoNewOldResult<UserEntity>> {
      // checking user existance
      const existingUser = await this.userRepository.findOneBy({ username })
      if (!existingUser) {
        throw new NotFoundException('user not found')
      }

      // updating wanted user field 
      Object.assign(existingUser, updatedUser)

      // applying update to user field in database
      const updatedDocument = await this.userRepository.update(existingUser)
      
      return updatedDocument ? updatedDocument : null
  }

  async removeUser(username: string): Promise<void> {
    await this.userRepository.removeBy({ username });
  }

  async userHandleError(message: string, currentUser: UserEntity, wantedUser: UserEntity) {
    if (currentUser.role !== 'ADMIN') {
      if (currentUser.role !== 'SUB_ADMIN' || wantedUser.role !== 'USER') {
        throw new ForbiddenException(
          message,
        );
      }
    }
  } 
}
