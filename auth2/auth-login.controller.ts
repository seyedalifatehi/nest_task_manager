import { Post, UseGuards } from '@nestjs/common';

export class AuthLoginController {
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(
    @Body() req: AuthDto,
    @Res({ passthrough: true }) res: ResponseType,
  ) {
    const authToken = await this.authService.login(req);
    this.authService.storeTokenInCookie(res, authToken);
    res.status(200).send({ message: 'ok' });
    return;
  }
}
