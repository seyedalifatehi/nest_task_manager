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

  // this methos is for creating user accounts
  // only admin can add users
  async createUser(
    user: UserEntity,
    currentUserEmail: string,
  ): Promise<Object> {
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
    const createdUser = await this.userRepository.save(user);

    return {
      username: createdUser.username,
      email: createdUser.email,
      message: 'user created successfully',
    };
  }

  // this method shows all of the users
  // you can filter users by their role
  async findAllUsers(
    role?: 'USER' | 'SUB_ADMIN' | 'ADMIN',
  ): Promise<ResultList<UserEntity>> {
    if (role) {
      const rolesArray = this.userRepository.findManyBy({ role });
      if ((await rolesArray).results.length === 0) {
        throw new NotFoundException('Role Not Found');
      }
      return rolesArray;
    }

    return await this.userRepository.findAll();
  }

  // user can change his/her password here
  async changePassword(
    currentUserEmail: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<Object> {
    const currentUser = await this.findOneUserByEmail(currentUserEmail);

    if (currentUser.password !== oldPassword) {
      throw new ForbiddenException(
        'You entered your old password incorrectly!',
      );
    }

    if (newPassword === oldPassword) {
      throw new ForbiddenException('This is your current password.');
    }
    this.updateUser(currentUser.username, { password: newPassword });

    return {
      message: 'password changed successfully',
    };
  }

  // in this method admin can increase a USER's role to SUB_ADMIN
  async increaseRole(wantedUser: UserEntity): Promise<Object> {
    await this.updateUser(wantedUser.username, { role: 'SUB_ADMIN' });

    return {
      message: `${wantedUser.username}\'s role increased successfully`,
    };
  }

  // in this method admin can decrease a SUB_ADMIN's role to USER
  async decreaseRole(wantedUser: UserEntity): Promise<Object> {
    await this.updateUser(wantedUser.username, { role: 'USER' });

    return {
      message: `${wantedUser.username}\'s role decreased successfully`,
    };
  }

  //
  async changeRole(currentUserEmail: string, selectedUserUsername: string): Promise<Object> {
    const currentUser = await this.findOneUserByEmail(currentUserEmail);
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('only admin can change users roles');
    }

    const wantedUser = await this.findOneUserByUsername(selectedUserUsername);
    if (!wantedUser) {
      throw new NotFoundException('User Not Found');
    }

    if (wantedUser.role === 'SUB_ADMIN') {
      return this.decreaseRole(wantedUser);
    } else {
      if (wantedUser.role === 'USER') {
        return this.increaseRole(wantedUser);
      }
    
      else {
        throw new ForbiddenException('you cannot change your role because you are admin')
      }
    }

    return {
      message: `${wantedUser.username}\'s role decreased successfully`,
    };
  }

  // this method changes the username of current user account
  async editUsername(
    currentUserEmail: string,
    newUsername: string,
  ): Promise<Object> {
    const currentUser = await this.findOneUserByEmail(currentUserEmail);
    if (newUsername === currentUser.username) {
      throw new ForbiddenException(
        'you cannot consider your current username as your new username',
      );
    }

    this.updateUser(currentUser.username, { username: newUsername });
    return {
      message: 'Your username has changed successfully!',
    };
  }

  // this method changes the email of current user account
  async editEmail(currentUserEmail: string, newEmail: string): Promise<Object> {
    const currentUser = await this.findOneUserByEmail(currentUserEmail);
    if (newEmail === currentUser.email) {
      throw new ForbiddenException(
        'you cannot consider your current email as your new email',
      );
    }

    this.updateUser(currentUser.username, { email: newEmail });
    return {
      message: 'Your email has changed successfully!',
    };
  }

  // this method finds a user account based on its email
  async findOneUserByEmail(email: string): Promise<UserEntity | null> {
    const foundUser = await this.userRepository.findOneBy({ email });

    if (!foundUser) {
      throw new NotFoundException('Email Not Found');
    }

    return foundUser;
  }

  // this method finds a user account based on its username
  async findOneUserByUsername(username: string): Promise<UserEntity | null> {
    const foundUser = await this.userRepository.findOneBy({ username });

    if (!foundUser) {
      throw new NotFoundException('Username Not Found');
    }

    return foundUser;
  }

  // this method finds a user account based on its id
  async findOneUserById(_id: string): Promise<UserEntity | null> {
    const foundUser = await this.userRepository.findOneBy({ _id });

    if (!foundUser) {
      throw new NotFoundException('Id Not Found');
    }

    return foundUser;
  }

  // this mehod is used for edit a user account
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

  // admin can remove a user with this method
  async removeUser(
    username: string,
    currentUserEmail: string,
  ): Promise<Object> {
    const currentUser = this.findOneUserByEmail(currentUserEmail);
    if ((await currentUser).role !== 'ADMIN') {
      throw new ForbiddenException('only admin can delete users');
    }

    await this.userRepository.removeBy({ username });
    return {
      message: 'user removed successfully',
    };
  }

  // this method is for handling errors represent that admin have access to all the features of
  // sub admins and user and sub admin have access to all the features of users
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
