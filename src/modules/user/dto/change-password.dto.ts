import { IsString } from 'class-validator';

export class ChangePasswordDto {
    @IsString()
    oldPassword: string;

    @IsString()
    password: string;

    @IsString()
    confirmPassword: string
}
