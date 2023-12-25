import { Injectable, NotFoundException } from '@nestjs/common';
import {
  InjectRepository,
  ArangoRepository,
  ResultList,
  ArangoNewOldResult,
} from 'nest-arango';
import { UpdateUserDto } from './dto/update-user.dto';
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

  async findAll(): Promise<ResultList<UserEntity>> {
    return await this.userRepository.findAll();
  }

  async findOneUser(username: string): Promise<UserEntity | null> {
    return await this.userRepository.findOneBy({ username })
  }

  async update(id: number, updateUserDto: UpdateUserDto) {

  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
