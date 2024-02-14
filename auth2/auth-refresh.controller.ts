export class AuthLoginController {
    @UseGuards(RefreshAuthGuard)
    @Get('refresh')
    @ApiQuery({ name: 'username' })
    async refreshTokens(
      @Query() query, 
      @Req() req: RequestType, 
      @Res({ passthrough: true }) res: ResponseType
    ) {
      const refreshToken = req.cookies.refresh_token;
      const newAuthToken = await this.authService.refreshAccessToken(query.username, refreshToken);
      this.authService.storeTokenInCookie(res, newAuthToken);
      res.status(200).send({message: 'ok'});
      return;
    }
}