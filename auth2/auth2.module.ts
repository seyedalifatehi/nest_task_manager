import { JwtStrategy } from './strategy/jwt.strategy';
import { RefreshTokenStrategy } from './strategy/refreshToken.strategy';

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