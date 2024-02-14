import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { LoginUserDto } from 'src/users/dto/login-user.dto';
import { UserEntity } from 'src/users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(user: LoginUserDto) {
    console.log(user);
    const reqUser = await this.usersService.findOneUserByEmail(user.email);
    if (reqUser.isDeleted) {
      throw new NotFoundException('User not found');
    }

    if (reqUser?.password !== user.password || !reqUser) {
      throw new UnauthorizedException('Entered email or password is wrong!');
    }
    const payload = { _id: reqUser._id };
    return {
      accessToken: await this.jwtService.signAsync(payload),
      refreshToken: await this.jwtService.signAsync(payload, {
        expiresIn: '7d',
      }),
    };
  }

  async refreshAccessToken(refreshToken: string) {
    // Verify the refresh token
    // Retrieve the associated user from the database
    // Generate a new access token for the user
    // Return the new access token
    const user = await this.validateRefreshToken(refreshToken);
    console.log(user);

    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Generate a new access token
    const payload = { _id: user._id };
    const accessToken = await this.jwtService.signAsync(payload);
    return accessToken;
  }

  async validateRefreshToken(refreshToken: string): Promise<UserEntity | null> {
    try {
      // console.log(refreshToken);

      // Decode the refresh token to get the payload (user ID)
      const decodedToken = await this.jwtService.verifyAsync(refreshToken);
      console.log(await decodedToken);

      if (!(await decodedToken)) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      const userId = await decodedToken._id; // Assuming 'sub' contains the user ID

      // Retrieve the user from the database using the user ID
      const user = await this.usersService.findOneUserById(userId);

      // Return the user if the refresh token is valid
      return user;
    } catch (error) {
      console.log(await error);
      // If the token is invalid or expired, or any other error occurs, return null
      return null;
    }
  }
}
