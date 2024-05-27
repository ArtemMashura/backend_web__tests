import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { TokenService } from 'src/services/token/token.service';
import { UserService } from '../user/user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { AuthMessage } from './messages/auth.message';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly tokenService: TokenService
    ) {}

    async generateTokens(id: number, uuid: string) {
        return await this.tokenService.generateTokens({ id, uuid });
    }

    async create(newUser: CreateUserDto, profile_url: string) {
        return await this.userService.create({ ...newUser, profile_url });
    }

    async login(login: LoginDto) {
        const user = await this.userService.findOneByUsername(login.username);

        if (!(await bcrypt.compare(login.password, user.password))) {
            throw new HttpException(
                AuthMessage.notMatchPassword,
                HttpStatus.UNAUTHORIZED
            );
        }

        return user;
    }

    async refreshToken(refreshToken: string) {
        // throw error if token is not valid
        const tokenPayload = await this.tokenService.verifyToken(
            refreshToken,
            'refresh'
        );

        // throw error if user is not found
        const user = await this.userService.findOneByUid(tokenPayload.uuid);

        return await this.generateTokens(user.id, user.uuid);
    }
}
