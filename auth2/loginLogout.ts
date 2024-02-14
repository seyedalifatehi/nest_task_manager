export class LoginLogout {
  async login(user: AuthDto): Promise<AuthTokenDto> {
    const foundUser = await this.usersService.findUser(user.username);
    if (foundUser) {
      const tokens = await this.getTokens(user.username, foundUser.role);
      await this.updateRefreshToken(user.username, tokens.refreshToken);
      return tokens;
    }
    return {
      accessToken: null,
      refreshToken: null,
    };
  }

  async logout(username: string) {
    await this.usersService.findAndUpdateUser(
      username,
      Object.assign(new UpdateUserDto(), { refreshToken: null }),
    );
  }
}
