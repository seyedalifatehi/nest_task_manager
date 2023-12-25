import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthService } from './auth/auth.service';

@Module({
  imports: [UsersModule],
  controllers: [AppController],
  providers: [AppService, AuthService],
})
export class AppModule {}
