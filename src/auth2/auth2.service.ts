import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginUserDto } from 'src/users/dto/login-user.dto';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { UserEntity } from 'src/users/entities/user.entity';

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

  async login(user: UserEntity) {
    const payload = { _id: user._id };
    return {
      access_token: await this.jwtService.signAsync(payload),
      refresh_token: await this.jwtService.signAsync(payload, {
        expiresIn: '7d',
      }),
    };
  }
}
