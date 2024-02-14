import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { Auth2Service } from '../auth2.service';
import { LoginUserDto } from 'src/users/dto/login-user.dto';
import { Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private auth2Service: Auth2Service) {
    super();
  }

  async validate(loggedinUser: LoginUserDto) {
    const user = await this.auth2Service.validateUser(loggedinUser);
    if (!user) {
      throw new UnauthorizedException('');
    }

    return user;
  }
}
