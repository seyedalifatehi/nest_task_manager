import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository, ArangoRepository } from 'nest-arango';
import { aql, Database } from 'arangojs';
import { UserEntity } from './entities/user.entity';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs/promises';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';

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
    currentUserId: string,
  ): Promise<Object> {
    const currentUser = await this.findOneUserById(currentUserId);

    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('only admin can add new user!');
    }

    const query = await db.query(aql`
        LET emailExists = (
          FOR u IN Users
            FILTER u.email == ${user.email}
            RETURN u
        )
        
        LET usernameExists = (
          FOR u IN Users
            FILTER u.username == ${user.username}
            RETURN u
        )
        
        LET userWithEmailExists = LENGTH(emailExists) > 0
        LET userWithUsernameExists = LENGTH(usernameExists) > 0
      
        LET createdUser = (
          FILTER !userWithEmailExists && !userWithUsernameExists
          INSERT {
            "role": "USER",
            "userTaskIds": ${[]},
            "username": ${user.username},
            "email": ${user.email},
            "password": ${user.password},
            "userProfilePhotoPath": ${''}
          } INTO Users
          
          RETURN {
            "username": ${user.username},
            "email": ${user.email},
            "message": 'User created successfully'
          }
        )
        
        RETURN LENGTH(createdUser) > 0 ? createdUser[0] : null
      `);
    const createdUser = await query.next();

    if (!createdUser) {
      throw new ForbiddenException('this username or email already exists');
    }
    return createdUser;
  }

  // this method shows all of the users
  // you can filter users by their role
  async findAllUsers(role?: 'USER' | 'SUB_ADMIN' | 'ADMIN'): Promise<any> {
    let users: string | any[];

    if (role) {
      const usersQuery = await db.query(aql`
        FOR u IN Users
          FILTER u.role == ${role} 
          RETURN {
            "username": u.username,
            "email": u.email,
            "role": u.role
          }
      `);

      users = await usersQuery.all();

      if (
        users.length === 0 &&
        role != 'USER' &&
        role != 'SUB_ADMIN' &&
        role != 'ADMIN'
      ) {
        throw new NotFoundException('Role Not Found');
      }

      return users;
    }

    const allUsersQuery = await db.query(aql`
      FOR u IN Users
        RETURN {
          "username": u.username,
          "email": u.email,
          "role": u.role
        }
    `);

    users = await allUsersQuery.all();
    return users;
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
    await this.updateUser(currentUser, { password: newPassword });

    return {
      message: 'password changed successfully',
    };
  }

  // in this method admin can increase a USER's role to SUB_ADMIN
  async increaseRole(wantedUser: UserEntity): Promise<Object> {
    await this.updateUser(wantedUser, { role: 'SUB_ADMIN' });

    return {
      message: `${wantedUser.username}\'s role increased successfully`,
    };
  }

  // in this method admin can decrease a SUB_ADMIN's role to USER
  async decreaseRole(wantedUser: UserEntity): Promise<Object> {
    await this.updateUser(wantedUser, { role: 'USER' });

    return {
      message: `${wantedUser.username}\'s role decreased successfully`,
    };
  }

  // this method changes the role of a user based on his/her current user
  async changeRole(
    currentUserEmail: string,
    selectedUserUsername: string,
  ): Promise<Object> {
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
        return await this.increaseRole(wantedUser);
      } else {
        throw new ForbiddenException(
          'you cannot change your role because you are admin',
        );
      }
    }
  }

  // this method changes the username of current user account
  async editUsername(
    currentUserEmail: string,
    newUsername: string,
  ): Promise<Object> {
    const currentUser = await this.findOneUserByEmail(currentUserEmail);
    const oldUsername = currentUser.username;
    if (newUsername === oldUsername) {
      throw new ForbiddenException(
        'you cannot consider your current username as your new username',
      );
    }

    const existUser = await db.query(aql`
      FOR u IN Users
        FILTER u.username == ${newUsername}
        LIMIT 1
        RETURN u
    `);

    if (await existUser.next()) {
      throw new ForbiddenException('this username exists');
    }

    await this.updateUser(currentUser, {
      username: newUsername,
    });

    await db.query(aql`
      FOR taskId IN ${currentUser.userTaskIds}
        FOR task IN Tasks
          FILTER task._id == taskId
          LIMIT 1
          UPDATE { _key: task._key, username: ${newUsername} } IN Tasks
    `);

    return {
      message: 'Your username has changed successfully!',
      yourOldUsername: oldUsername,
      yourNewUsername: newUsername,
    };
  }

  // this method changes the email of current user account
  async editEmail(currentUserEmail: string, newEmail: string): Promise<Object> {
    const currentUser = await this.findOneUserByEmail(currentUserEmail);
    const oldEmail = currentUser.email;
    if (newEmail === oldEmail) {
      throw new ForbiddenException(
        'you cannot consider your current email as your new email',
      );
    }

    const existUser = await db.query(aql`
      FOR u IN Users
        FILTER u.email == ${newEmail}
        LIMIT 1
        RETURN u
    `);

    if (await existUser.next()) {
      throw new ForbiddenException('this email exists');
    }

    await this.updateUser(currentUser, { email: newEmail });
    return {
      message: 'Your email has changed successfully!',
      yourOldEmail: oldEmail,
      yourNewEmail: newEmail,
    };
  }

  // this method finds a user account based on its email
  async findOneUserByEmail(email: string): Promise<UserEntity | null> {
    const findQuery = await db.query(aql`
    FOR u IN Users
      FILTER u.email == ${email}
      RETURN u
  `)

  const foundUser = await findQuery.next()


    if (!foundUser) {
      throw new NotFoundException('Email Not Found');
    }

    return foundUser;
  }

  // this method finds a user account based on its username
  async findOneUserByUsername(username: string): Promise<UserEntity | null> {
    const findQuery = await db.query(aql`
      FOR u IN Users
        FILTER u.username == ${username}
        RETURN u
    `)

    const foundUser = await findQuery.next()

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

  // this method is used for edit a user account
  async updateUser(
    user: UserEntity,
    updatedUser: Partial<UserEntity>,
  ): Promise<any> {
    const updatedDocument = await db.query(aql`
      UPDATE ${user} WITH ${updatedUser} IN Users
      RETURN NEW
    `);

    return updatedDocument ? updatedDocument : null;
  }

  // admin can remove a user with this method
  async removeUser(
    username: string,
    currentUserEmail: string,
  ): Promise<Object> {
    const currentUser = await this.findOneUserByEmail(currentUserEmail);
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('only admin can delete users');
    }

    await db.query(aql`
      LET user = (
        FOR u IN Users
          FILTER u.username == ${username}
          LIMIT 1
          RETURN u
      )[0]

      FOR taskId IN user.userTaskIds
        FOR task IN Tasks
          FILTER task._id == taskId
          REMOVE task IN Tasks
    `);

    await this.userRepository.removeBy({ username });
    return {
      message: 'user removed successfully',
    };
  }

  // this method is for handling errors represent that admin have access to all the features of
  // sub admins and user and sub admin have access to all the features of users
  async userAccessHandleError(currentUser: UserEntity, wantedUser: UserEntity) {
    if (currentUser.role !== 'ADMIN') {
      if (!(wantedUser.role === 'USER' && currentUser.role === 'SUB_ADMIN')) {
        return false;
      }
    }

    return true;
  }
}
