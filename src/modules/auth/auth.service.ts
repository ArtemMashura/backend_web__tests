import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { TokenService } from 'src/services/token/token.service';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';
import { AuthMessage } from './messages/auth.message';
import { CreateUserDto } from 'src/global/dto/create-user.dto';
import { Tokens } from './types/tokens.type';
import * as argon from 'argon2';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../user/entities/user.entity';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(UserEntity)
        private userRepository: Repository<UserEntity>,
        private readonly userService: UserService,
        private readonly tokenService: TokenService
    ) {}

    async generateTokens(id: number, uuid: string):Promise<Tokens>  {
        return await this.tokenService.generateToken({ id, uuid });
    }

    async register(newUserInfo: CreateUserDto, profile_url?: string):Promise<Array<object>> {
        if (!this.comparePasswords(newUserInfo.password, newUserInfo.confirmPassword)) {
            throw new BadRequestException("Password and confirm password must be the same!");
        }
        console.log(1)
        const newUser = await this.userService.create({ ...newUserInfo, profile_url });
        console.log(2)
        const tokens = await this.generateTokens(newUser.id, newUser.uuid);
        console.log(3)
        this.updateRtHash(newUser.id, tokens.refreshToken)
        console.log(4)
        return [newUser, tokens]
    }

    async login(login: LoginDto):Promise<Array<object>> {
        const user = await this.userService.findOneByNickname(login.nickname);

        if (!(await bcrypt.compare(login.password, user.password))) {
            throw new HttpException(
                AuthMessage.notMatchPassword,
                HttpStatus.UNAUTHORIZED
            );
        }

        const tokens = await this.generateTokens(user.id, user.uuid);
        this.updateRtHash(user.id, tokens.refreshToken)

        return [user, tokens];
    }

    async refreshToken(refreshToken: string):Promise<Tokens> {
        // throw error if token is not valid
        const tokenPayload = await this.tokenService.verifyToken(
            refreshToken,
            'refresh'
        );

        // throw error if user is not found
        const user = await this.userService.findOneByUid(tokenPayload.uuid);

        const tokens:Tokens = await this.generateTokens(user.id, user.uuid);
        this.updateRtHash(user.id, tokens.refreshToken)

        return await this.generateTokens(user.id, user.uuid);
    }

    comparePasswords(pass1: string, pass2: string) {
        return pass1 === pass2;
    }

    async updateRtHash(userId: number, rt: string): Promise<void> {
        const hash = await argon.hash(rt);


        this.userRepository.update(userId, {
            hashedRt: hash
        });


        // await this.prisma.user.update({
        //   where: {
        //     id: userId,
        //   },
        //   data: {
        //     hashedRt: hash,
        //   },
        // });
    }

    
}
