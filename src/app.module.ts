import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthService } from './auth/auth.service';
import { ArangoModule } from 'nest-arango';
import { UsersService } from './users/users.service';
import { UserEntity } from './users/entities/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './auth/constants';

@Module({
  imports: [
    UsersModule,
    ArangoModule.forRoot({
      config: {
        url: 'http://localhost:8529',
        databaseName: '_system',
        auth: {
          username: 'root',
          password: 'azim1383'
        },
      },
    }),
    ArangoModule.forFeature([
      UserEntity,
    ]),
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '600s' },
    }),
  ],
  controllers: [AppController],
  providers: [AppService, AuthService, UsersService],
  
})
export class AppModule {}
