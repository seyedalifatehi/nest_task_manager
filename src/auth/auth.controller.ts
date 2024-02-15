import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { LoginUserDto } from '../users/dto/login-user.dto';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({
    summary: 'ورود کاربر',
  })
  async login(@Body() user: LoginUserDto) {
    return await this.authService.login(user);
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'رفرش توکن کاربر',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refreshToken: {
          type: 'string',
        },
      },
    },
  })
  async refreshAccessToken(@Body() refreshAccessToken: {refreshToken: string}) {
    return await this.authService.refreshAccessToken(refreshAccessToken.refreshToken);
  }
}
