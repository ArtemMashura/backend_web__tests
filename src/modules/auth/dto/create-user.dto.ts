import { IsString } from 'class-validator';

export class CreateUserDto {
    @IsString()
    username: string;

    @IsString()
    // @IsStrongPassword({ minLength: 4 })
    password: string;
}
