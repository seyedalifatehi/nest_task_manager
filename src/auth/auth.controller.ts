import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { CreateUserDto } from '../users/dto/create-user.dto'
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('login')
@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
    ){}

    @Post('login')
    @ApiOperation({
        summary: 'ورود کاربر',
    })
    async login(@Body() user : CreateUserDto) {
        return await this.authService.login(user);
    }
}
