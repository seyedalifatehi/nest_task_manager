import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import {
  InjectRepository,
  ArangoRepository,
  ResultList,
  ArangoNewOldResult,
} from 'nest-arango';
import { aql, Database } from 'arangojs';
import { UserEntity } from './entities/user.entity';

const db = new Database({
  url: 'http://localhost:8529',
  databaseName: '_system',
  auth: {
    username: 'root',
    password: 'azim1383',
  },
});

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: ArangoRepository<UserEntity>,
  ) {}

  async createUser(
    user: UserEntity,
    currentUserEmail: string,
  ): Promise<UserEntity> {
    const currentUser = await this.findOneUserByEmail(currentUserEmail);

    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('only admin can add new user!');
    }

    await db.query(aql`
    FOR u IN users
      FILTER u.email == ${user.email}
      LIMIT 1
      THROW { "errorCode": 403, "errorMessage": "This email already exists" }
  
    FOR u IN users
      FILTER u.username == ${user.username}
      LIMIT 1
      THROW { "errorCode": 403, "errorMessage": "This username already exists" }
    `);

    user.role = 'USER';
    user.userTaskIds = [];
    return await this.userRepository.save(user);
  }

  async findAllUsers(
    role?: 'USER' | 'SUB_ADMIN' | 'ADMIN',
  ): Promise<ResultList<UserEntity>> {
    if (role) {
      const rolesArray = this.userRepository.findManyBy({ role });
      if ((await rolesArray).results.length === 0) {
        throw new NotFoundException('User Role Not Found');
      }
      return rolesArray;
    }

    return await this.userRepository.findAll();
  }

  async findOneUserByEmail(email: string): Promise<UserEntity | null> {
    return await this.userRepository.findOneBy({ email });
  }

  async findOneUserByUsername(username: string): Promise<UserEntity | null> {
    return await this.userRepository.findOneBy({ username });
  }

  async findOneUserById(_id: string): Promise<UserEntity | null> {
    return await this.userRepository.findOneBy({ _id });
  }

  async updateUser(
    username: string,
    updatedUser: Partial<UserEntity>,
  ): Promise<ArangoNewOldResult<UserEntity>> {
    // checking user existance
    const existingUser = await this.userRepository.findOneBy({ username });
    if (!existingUser) {
      throw new NotFoundException('user not found');
    }

    // updating wanted user field
    Object.assign(existingUser, updatedUser);

    // applying update to user field in database
    const updatedDocument = await this.userRepository.update(existingUser);

    return updatedDocument ? updatedDocument : null;
  }

  async removeUser(username: string): Promise<void> {
    await this.userRepository.removeBy({ username });
  }

  async userAccessHandleError(
    message: string,
    currentUser: UserEntity,
    wantedUser: UserEntity,
  ) {
    if (currentUser.role !== 'ADMIN') {
      if (currentUser.role !== 'SUB_ADMIN' || wantedUser.role !== 'USER') {
        throw new ForbiddenException(message);
      }
    }
  }
}
