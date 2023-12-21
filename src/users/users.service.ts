import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

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

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
