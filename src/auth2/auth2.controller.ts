import {
  Controller,
  Inject,
  Post,
  Request,
  UseGuards,
  forwardRef,
} from '@nestjs/common';
import { Auth2Service } from './auth2.service';
import { UsersService } from 'src/users/users.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { RefreshJwtGuard } from './guards/refresh-jwt-auth.guard';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('auth2')
@Controller('auth2')
export class Auth2Controller {
  constructor(
    private auth2Srevice: Auth2Service,

    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
  ) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    return await this.auth2Srevice.login(req.user._id);
  }

  @UseGuards(RefreshJwtGuard)
  @Post('refresh')
  async refreshToken(@Request() req) {
    return await this.auth2Srevice.refreshToken(req.user._id);
  }
}
