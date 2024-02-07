import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository, ArangoRepository } from 'nest-arango';
import { aql, Database } from 'arangojs';
import { UserEntity } from './entities/user.entity';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fsPromise from 'fs/promises';
import { promisify } from 'util';
import { NewUsernameAndEmailDto } from './dto/new-un-and-email.dto';

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
  async createUser(user: UserEntity, currentUserId: string): Promise<Object> {
    const currentUser = await this.findOneUserById(currentUserId);

    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('only admin can add new user!');
    }

    const query = await db.query(aql`
        LET existUser = (
          FOR u IN Users
            FILTER u.email == ${user.email} || u.username == ${user.username}
            RETURN u
        )
        
        LET isUserExist = LENGTH(existUser) > 0
      
        LET createdUser = (
          FILTER !isUserExist
          INSERT {
            "role": "USER",
            "username": ${user.username},
            "email": ${user.email},
            "password": ${user.password},
            "userProfilePhotoPath": ${''},
            "isDeleted": ${false}
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

    if (!(await createdUser)) {
      throw new ForbiddenException('this username or email already exists');
    }
    return await createdUser;
  }

  // this method shows all of the users
  // you can filter users by their role
  async findAllUsers(role?: 'USER' | 'SUB_ADMIN' | 'ADMIN'): Promise<any> {
    let users: string | any[];

    if (role) {
      const usersQuery = await db.query(aql`
        FOR u IN Users
          FILTER u.role == ${role} && !u.isDeleted
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
        FILTER !u.isDeleted
        RETURN {
          "username": u.username,
          "email": u.email,
          "role": u.role
        }
    `);

    users = await allUsersQuery.all();
    return users;
  }

  async findCurrentUser(currentUserId: string) {
    const currentUser = await db.query(aql`
      FOR u IN Users
        FILTER u._id == ${currentUserId} && !u.isDeleted
        RETURN {
          "username": u.username,
          "email": u.email,
          "role": u.role
        }
    `);

    if (!currentUser) {
      throw new NotFoundException('user not found');
    }
    return await currentUser.next();
  }

  // user can change his/her password here
  async changePassword(
    currentUserId: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<Object> {
    const currentUser = await this.findOneUserById(currentUserId);

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
    currentUserId: string,
    selectedUserUsername: string,
  ): Promise<Object> {
    const currentUser = await this.findOneUserById(currentUserId);
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('only admin can change users roles');
    }

    const wantedUser = await this.findOneUserByUsername(selectedUserUsername);
    if (!wantedUser || wantedUser.isDeleted) {
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
    currentUserId: string,
    newUsername: string,
  ): Promise<Object> {
    const currentUser = await this.findOneUserById(currentUserId);
    const oldUsername = currentUser.username;

    const existUser = await db.query(aql`
      FOR u IN Users
        FILTER u.username == ${newUsername} && ${oldUsername} != ${newUsername}
        LIMIT 1
        RETURN u
    `);
    if (await existUser.next()) {
      throw new ForbiddenException('this username already exists');
    }

    if (currentUser.userProfilePhotoPath) {
      const oldFilePath = currentUser.userProfilePhotoPath; // Replace with your old file path
      console.log(oldFilePath);

      const newFilePath = `./images/profiles/${newUsername}.jpeg`; // Replace with your new file path

      fs.rename(oldFilePath, newFilePath, (err) => {
        if (err) {
          console.error('Error renaming file:', err);
        } else {
          console.log('File renamed successfully');
        }
      });
      currentUser.userProfilePhotoPath = newFilePath;
      await this.updateUser(currentUser, currentUser);
    }

    await this.updateUser(currentUser, {
      username: newUsername,
    });

    await db.query(aql`
      FOR task IN Tasks
        FILTER task.username == ${oldUsername}
        UPDATE task WITH { username: ${newUsername} } IN Tasks
    `);

    return {
      message: 'Your username has changed successfully!',
      yourOldUsername: oldUsername,
      yourNewUsername: newUsername,
    };
  }

  // this method changes the email of current user account
  async editEmail(currentUserId: string, newEmail: string): Promise<Object> {
    const currentUser = await this.findOneUserById(currentUserId);
    const oldEmail = currentUser.email;

    const existUser = await db.query(aql`
      FOR u IN Users
        FILTER u.email == ${newEmail} && ${oldEmail} != ${newEmail}
        LIMIT 1
        RETURN u
    `);

    if (await existUser.next()) {
      throw new ForbiddenException('this email already exists');
    }

    await this.updateUser(currentUser, { email: newEmail });
    return {
      message: 'Your email has changed successfully!',
      yourOldEmail: oldEmail,
      yourNewEmail: newEmail,
    };
  }

  async uploadProfilePhoto(currentUserId: string, image: Express.Multer.File) {
    const currentUser = await this.findOneUserById(currentUserId);
    if (currentUser.userProfilePhotoPath.length !== 0) {
      throw new ForbiddenException(
        'you currently have profile photo. for set a new profile photo you should delete your profile photo first',
      );
    }

    const imageId = await uuidv4();
    const folderPath: string = './images/profiles/';
    const imageBuffer = image.buffer;
    const imagePath = path.join(folderPath, `${currentUser.username}.jpeg`);
    await fsPromise.writeFile(imagePath, imageBuffer);

    console.log(imagePath);
    currentUser.userProfilePhotoPath = imagePath;
    await this.updateUser(currentUser, currentUser);

    return {
      imageId: await imageId,
      message: 'photo uploaded successfully',
    };
  }

  async deleteProfilePhoto(currentUserId: string) {
    const currentUser = await this.findOneUserById(currentUserId);
    if (currentUser.userProfilePhotoPath.length === 0) {
      throw new ForbiddenException('You currently dont have a profile photo');
    }

    try {
      // Ensure that the path is a valid file path before attempting to delete
      const filePath = currentUser.userProfilePhotoPath;
      if (fs.existsSync(filePath)) {
        // Use promisify to make unlink work with async/await
        const unlinkAsync = promisify(fs.unlink);
        await unlinkAsync(filePath);

        // Clear the userProfilePhotoPath and update the user
        currentUser.userProfilePhotoPath = '';
        await this.updateUser(currentUser, currentUser);
      } else {
        throw new BadRequestException(
          'Profile photo not found at the specified path',
        );
      }

      return {
        message: 'Your profile photo was deleted successfully',
      };
    } catch (error) {
      console.error(error);
      throw new BadRequestException(
        'An error occurred while deleting the profile photo.',
      );
    }
  }

  // this method finds a user account based on its email
  async findOneUserByEmail(email: string): Promise<UserEntity | null> {
    const findQuery = await db.query(aql`
      FOR u IN Users
        FILTER u.email == ${email}
        RETURN u
    `);

    const foundUser = await findQuery.next();
    return await foundUser;
  }

  // this method finds a user account based on its username
  async findOneUserByUsername(username: string): Promise<UserEntity | null> {
    const findQuery = await db.query(aql`
      FOR u IN Users
        FILTER u.username == ${username}
        RETURN u
    `);

    const foundUser = await findQuery.next();

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

  // admin can clear a user from database with this method
  async clearUser(username: string, currentUserId: string): Promise<Object> {
    const currentUser = await this.findOneUserById(currentUserId);
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('only admin can clear a user from database');
    }

    const wantedUser = await this.findOneUserByUsername(username);
    if (!wantedUser.isDeleted) {
      throw new ForbiddenException('this user is not deleted');
    }

    await db.query(aql`
      FOR task IN Tasks
        FILTER task.username == ${username}
        REMOVE task IN Tasks
    `);

    await this.userRepository.removeBy({ username });
    return {
      message: 'user cleared successfully',
    };
  }

  // admin can clear all users from database with this method
  async clearAllDeletedUsers(currentUserId: string): Promise<Object> {
    const currentUser = await this.findOneUserById(currentUserId);
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('only admin can delete users');
    }

    await db.query(aql`
      FOR user IN Users
        FILTER user.isDeleted
        
        FOR task IN Tasks
          FILTER task.username == user.username
          REMOVE task IN Tasks
        
        REMOVE user IN Users        
    `);

    return {
      message: 'all users cleared successfully',
    };
  }

  // admin can recover a user with this method
  async recoverUser(username: string, currentUserId: string): Promise<Object> {
    const currentUser = await this.findOneUserById(currentUserId);
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('only admin can recover users');
    }

    const wantedUser = await this.findOneUserByUsername(username);
    if (!wantedUser.isDeleted) {
      throw new ForbiddenException('this user already exists');
    }

    await db.query(aql`
      FOR t IN Tasks
        FILTER t.username == ${username}
        UPDATE t WITH { isDeleted: false } IN Tasks
    `);

    await this.updateUser(wantedUser, { isDeleted: false });

    return {
      message: 'user recovered successfully',
    };
  }

  // admin can recover all users with this method
  async recoverAllUsers(currentUserId: string): Promise<Object> {
    const currentUser = await this.findOneUserById(currentUserId);
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('only admin can recover all users');
    }

    await db.query(aql`
      FOR user IN Users
        FILTER user.isDeleted
        UPDATE user WITH { isDeleted: false } IN Users
        FOR task IN Tasks
          FILTER task.username == user.username
          UPDATE task WITH { isDeleted: false } IN Tasks
    `);

    return {
      message: 'all users recovered successfully',
    };
  }

  // admin can recover a user with this method
  async getDeletedUsers(currentUserId: string): Promise<Object> {
    const currentUser = await this.findOneUserById(currentUserId);
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('only admin can see deleted users');
    }

    const usersQuery = await db.query(aql`
      FOR u IN Users
        FILTER u.isDeleted
        RETURN {
          "username": u.username,
          "email": u.email,
          "role": u.role
        }
    `);

    return await usersQuery.all();
  }

  // admin can delete a user with this method (user can be recovered)
  async deleteUser(username: string, currentUserId: string): Promise<Object> {
    const currentUser = await this.findOneUserById(currentUserId);
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('only admin can delete users');
    }

    const wantedUser = await this.findOneUserByUsername(username);
    if (wantedUser.isDeleted) {
      throw new ForbiddenException('this user is already deleted');
    }

    await db.query(aql`
      FOR t IN Tasks
        FILTER t.username == ${username}
        UPDATE t WITH { isDeleted: true } IN Tasks
    `);

    await db.query(aql`
      UPDATE ${wantedUser} WITH { isDeleted: true } IN Users
    `);

    return {
      message: 'user deleted successfully',
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
