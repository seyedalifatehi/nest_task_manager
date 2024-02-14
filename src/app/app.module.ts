import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from '../users/users.module';
import { ArangoModule } from 'nest-arango';
import { TasksModule } from '../tasks/tasks.module';
import { AuthModule } from '../auth/auth.module';
import { Auth2Module } from 'src/auth2/auth2.module';

@Module({
  imports: [
    TasksModule,
    UsersModule,
    AuthModule,
    Auth2Module,
    ArangoModule.forRoot({
      config: {
        url: 'http://localhost:8529',
        databaseName: '_system',
        auth: {
          username: 'root',
          password: 'azim1383',
        },
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
