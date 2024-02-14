import { Module } from '@nestjs/common';
import { JwtStrategy } from './jwt2.strategy';
import { RefreshTokenStrategy } from './refreshToken.strategy';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.register({}),
    ...
  ],
  providers: [
    ...,
    RefreshTokenStrategy
  ]
})