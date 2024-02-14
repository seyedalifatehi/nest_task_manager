export class updateRefreshToken {
  async refreshAccessToken(
    username: string,
    refreshToken: string,
  ): Promise<AuthTokenDto> {
    const user = await this.usersService.findUser(username);
    if (!user || !user.refreshToken) {
      throw new ForbiddenException('Access Denied');
    }

    const refreshTokenMatches = await argon2.verify(
      user.refreshToken,
      refreshToken,
    );

    //const refreshTokenMatches = user.refreshToken === refreshToken;
    if (!refreshTokenMatches) throw new ForbiddenException('Access Denied');
    const tokens = await this.getTokens(user.username, user.role);
    await this.updateRefreshToken(user.username, tokens.refreshToken);
    return tokens;
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedRefreshToken = await argon2.hash(refreshToken);
    await this.usersService.findAndUpdateUser(
      userId,
      Object.assign(new UpdateUserDto(), {
        refreshToken: hashedRefreshToken,
      }),
    );
  }

  storeTokenInCookie(res: ResponseType, authToken: AuthTokenDto) {
    res.cookie('access_token', authToken.accessToken, {
      maxAge: 1000 * 60 * 15,
      httpOnly: true,
    });
    res.cookie('refresh_token', authToken.refreshToken, {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      httpOnly: true,
    });
  }
}
