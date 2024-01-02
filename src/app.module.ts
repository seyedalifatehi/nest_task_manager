import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthService } from './auth/auth.service';
import { ArangoModule } from 'nest-arango';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './auth/constants';
import { AuthController } from './auth/auth.controller';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [
    TasksModule,
    UsersModule,
    ArangoModule.forRoot({
      config: {
        url: 'http://localhost:8529',
        databaseName: process.env.DB_NAME,
        auth: {
          username: process.env.DB_USERNAME,
          password: process.env.DB_PASSWORD
        },
      },
    }),
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
    }),
  ],
  controllers: [AppController, AuthController],
  providers: [AppService, AuthService],
})
export class AppModule {}
