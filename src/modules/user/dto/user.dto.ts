import { IsEmail, IsOptional, IsPhoneNumber, IsString, IsUrl } from "class-validator";

export class UserDto {
    @IsString()
    nickname: string;

    @IsString()
    @IsEmail()
    email: string;

    @IsString()
    @IsPhoneNumber()
    phone: string;

    @IsString()
    @IsUrl()
    @IsOptional()
    profile_url: string;

    @IsString()
    password: string;
}
