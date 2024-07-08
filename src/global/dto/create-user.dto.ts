import { IsString } from 'class-validator';
import { UserDto } from '../../modules/user/dto/user.dto';

export class CreateUserDto extends UserDto {
    @IsString()
    password: string;

    @IsString()
    confirmPassword: string;
}
