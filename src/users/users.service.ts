import { Injectable, NotFoundException } from '@nestjs/common';
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

  async findOneUserByUsername(email: string): Promise<UserEntity | null> {
    return await this.userRepository.findOneBy({ email })
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
      
      return updatedDocument
  }

  async removeUser(username: string): Promise<void> {
    await this.userRepository.removeBy({ username });
  }
}
