import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from 'src/users/dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(user: CreateUserDto) {
    console.log(user);
    const reqUser = await this.usersService.findOneUserByEmail(user.email);
    if (reqUser?.password !== user.password) {
      throw new UnauthorizedException();
    }
    const payload = { _id: reqUser._id, email: user.email };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
