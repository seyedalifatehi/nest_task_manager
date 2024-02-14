import { Inject, forwardRef } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from 'src/users/users.service';

export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: `${process.env.jwt_secret}`,
    });
  }

  async validate(payload: any) {
    const signedUser = await this.usersService.findOneUserById(payload._id);

    return {
      username: signedUser.username,
      password: signedUser.password,
    };
  }
}
