import { BadRequestException, ConflictException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { TokenService } from 'src/services/token/token.service';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';
import { AuthMessage } from './messages/auth.message';
import { CreateUserDto } from 'src/global/dto/create-user.dto';
import { Tokens } from './types/tokens.type';
import * as argon from 'argon2';
import { InjectRepository } from '@nestjs/typeorm';
import { createQueryBuilder, Repository } from 'typeorm';
import { UserEntity } from '../user/entities/user.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { v4 } from 'uuid';
import { FilesUploadS3Service } from 'src/services/files-upload-s3/files-upload-s3.service';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(UserEntity)
        private userRepository: Repository<UserEntity>,
        private readonly userService: UserService,
        private readonly tokenService: TokenService,
        private readonly filesUploadS3Service: FilesUploadS3Service,
        private eventEmitter: EventEmitter2

    ) {}

    async generateTokens(id: number, uuid: string):Promise<Tokens>  {
        return await this.tokenService.generateToken({ id, uuid });
    }

    async refreshToken(refreshToken: string):Promise<string> {
        // throw error if token is not valid
        const tokenPayload = await this.tokenService.verifyToken(
            refreshToken,
            'refresh'
        );

        // throw error if user is not found
        const user = await this.userService.findOneByUid(tokenPayload.uuid);
        
        return await this.tokenService.refreshAccessToken({ id: user.id, uuid: user.uuid });
    }

    async register(newUserInfo: CreateUserDto, file?: Express.Multer.File):Promise<Array<object>> {
        if (!this.comparePasswords(newUserInfo.password, newUserInfo.confirmPassword)) {
            console.log("error thrown")
            throw new BadRequestException("Password and confirm password must be the same!");
        }
        const user = await this.userRepository.createQueryBuilder("user")
            .where("user.nickname = :nickname", { nickname: newUserInfo.nickname })
            // .orWhere("user.email = :email", { email: newUserInfo.email })
            .orWhere("user.phone = :phone", { phone: newUserInfo.phone })
            .getOne()
        if (user) {
            var message;
            if (user.nickname === newUserInfo.nickname)
                message = "User with such nickname already exists"
            // else if (user.email === newUserInfo.email)
            //     message = "User with such email already exists"
            else if (user.phone === newUserInfo.phone)
                message = "User with such phone number already exists"
            else message = "Unknown error"
            console.log(message)
            throw new ConflictException(message);
        }
        var profile_url: string = null;
        if (file) {
            profile_url = await this.filesUploadS3Service.uploadProfilePhoto(                                       
                `${newUserInfo.nickname}/${v4()}.${file.mimetype.split('/')[1]}`, // Xepobopa/jasl3-vfk3a-fafo4-opiq3.png
                file.buffer,
                file.mimetype
            );
        }

        const newUser = await this.userService.create({ ...newUserInfo, profile_url });
        const tokens = await this.generateTokens(newUser.id, newUser.uuid);
        this.updateRtHash(newUser.id, tokens.refreshToken)
        return [newUser, tokens]
    }

    async login(login: LoginDto):Promise<Array<object>> {
        const user = await this.userService.findOneByNickname(login.nickname);

        console.log(user)

        if (!(await bcrypt.compare(login.password, user.password))) {
            throw new HttpException(
                AuthMessage.notMatchPassword,
                HttpStatus.UNAUTHORIZED
            );
        }

        const tokens = await this.generateTokens(user.id, user.uuid);
        this.updateRtHash(user.id, tokens.refreshToken)
        
        delete user.password
        delete user.hashedRt

        console.log("emitting onSuccesfulLogin")
        this.eventEmitter.emit(
            'onSuccesfulLogin',
            user
        );

        return [user, tokens];
    }

    

    async logout(refreshToken: string) {
        // throw error if token is not valid
        const tokenPayload = await this.tokenService.verifyToken(
            refreshToken,
            'refresh'
        );

        // throw error if user is not found
        await this.userRepository.createQueryBuilder()
            .update(UserEntity)
            .set({ hashedRt: null })
            .where("uuid = :userUUid", { userUUid: tokenPayload.uuid })
            .execute()

        return
    }

    comparePasswords(pass1: string, pass2: string) {
        return pass1 === pass2;
    }

    async updateRtHash(userId: number, rt: string): Promise<void> {
        const hash = await argon.hash(rt);

        console.log(hash)

        this.userRepository.update(userId, {
            hashedRt: hash
        });


        
    }

    
}
