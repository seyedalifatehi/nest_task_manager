import { Module } from '@nestjs/common';
import { Auth2Service } from './auth2.service';
import { Auth2Controller } from './auth2.controller';
import { UsersService } from 'src/users/users.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { LocalStrategy } from './strategies/local-strategy';
import { JwtStrategy } from './strategies/jwt-strategy';
import { RefreshJwtStrategy } from './strategies/refreshToken.strategy';
import { UsersModule } from 'src/users/users.module';

@Module({
  providers: [
    Auth2Service,
    JwtStrategy,
    LocalStrategy,
    RefreshJwtStrategy,
  ],
  controllers: [Auth2Controller],
  imports: [
    UsersModule,
    JwtModule.register({
      secret: `${process.env.jwt_secret}`,
      signOptions: {
        expiresIn: '300s',
      },
    }),
  ],
})
export class Auth2Module {}
