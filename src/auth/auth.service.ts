import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { LoginUserDto } from 'src/users/dto/login-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(user: LoginUserDto) {
    console.log(user);
    const reqUser = await this.usersService.findOneUserByEmail(user.email);
    if (reqUser.isDeleted) {
      throw new NotFoundException('User not found');
    }

    if (reqUser?.password !== user.password || !reqUser) {
      throw new UnauthorizedException('Entered email or password is wrong!');
    }
    const payload = { _id: reqUser._id };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
