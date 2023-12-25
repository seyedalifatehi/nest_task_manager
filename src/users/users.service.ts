import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  InjectRepository,
  ArangoRepository,
  ResultList,
  ArangoNewOldResult,
} from 'nest-arango';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: ArangoRepository<UserEntity>,
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
    return await this.userRepository.save(user);
  }

  async findAll(role?: 'USER' | 'SUB_ADMIN' | 'ADMIN'): Promise<ResultList<UserEntity>> {
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

  async updateUser(
    username: string,
    updatedUser: Partial<UserEntity>
    ): Promise<ArangoNewOldResult<any>> {
      // checking user existance
      const existingUser = await this.userRepository.findOneBy({ username })
      if (!existingUser) {
        throw new NotFoundException('username not found')
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
}
