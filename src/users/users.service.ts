import { Injectable, NotFoundException, Query } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { NotFoundError } from 'rxjs';

@Injectable()
export class UsersService {
  private users = [
    {
        "id": 1,
        "name": "Mohammad Reza Baghery",
        "email": "baghery1234@gmail.com",
        "role": "ADMIN",
    },

    {
        "id": 2,
        "name": "Arian Amini",
        "email": "arian1234@gmail.com",
        "role": "USER",
    },

    {
        "id": 3,
        "name": "Mollnoori",
        "email": "mollnoori1234@gmail.com",
        "role": "USER",
    },

    {
        "id": 4,
        "name": "doctor",
        "email": "doctor@gmail.com",
        "role": "USER",
    },

    {
        "id": 5,
        "name": "Seyed Ali Fatehi",
        "email": "afatehi07@gmail.com",
        "role": "SUB_ADMIN",
    },
  ]

  createUser(createUserDto: CreateUserDto) {
    const usersByHighestId = [...this.users].sort((a, b) => b.id - a.id)
    const newUser = {
      id: usersByHighestId[0].id + 1,
      ...createUserDto
    } 

    this.users.push(newUser)
    return newUser
  }

  // we can input a role to find the users with this role
  findAllUsers(@Query() role?: 'ADMIN' | 'SUB_ADMIN' | 'USER') {
    if (role) {
      const rolesArray = this.users.filter(user => user.role === role)
      if (rolesArray.length === 0) {
        throw new NotFoundException('User Role Not Found!')
      }

      return rolesArray
    }

    return this.users
  }

  findOneUser(id: number) {
    const foundUser = this.users.find(user => user.id === id)

    if (foundUser === null) {
      throw new NotFoundException('User Not Found');
    }

    return foundUser
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
