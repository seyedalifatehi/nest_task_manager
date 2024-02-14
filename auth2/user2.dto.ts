export class UserDto {
  username: string;
  password: string;
  role: Role;
  refreshToken?: string;
}
