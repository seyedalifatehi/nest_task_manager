import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginUserDto } from 'src/users/dto/login-user.dto';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class Auth2Service {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(loginedUser: LoginUserDto) {
    const user = await this.usersService.findOneUserByEmail(loginedUser.email);
    if (user && (await bcrypt.compare(loginedUser.password, user.password))) {
      const { password, ...result } = user;
      return result;
    }

    return null;
  }
}
