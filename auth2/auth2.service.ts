@Injectable()
export class Auth2Service {
    async getTokens(username: string, role: Role): Promise<AuthTokenDto> {
        const tokens = await Promise.all(
          [
            this.jwtService.signAsync(
              {
                username,
                role
              },
             {
               secret: this.configService.get<string>('secret'),
               expiresIn: '15m',
             }
           ), 
           this.jwtService.signAsync(
             {
              username ,
              role
             },
             {
               secret: this.configService.get<string>('refresh_secret'),
               expiresIn: '7d',
             }
            )
           ],
        );
        
        return {
          accessToken: tokens[0],
          refreshToken: tokens[1]
        };
     }
}