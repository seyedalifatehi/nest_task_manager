export class CreateUserDto {
    id: number;
    name: string;
    email: string;
    role: 'SUB_ADMIN' | 'CURRENT_USER' | 'ADMIN';
}
