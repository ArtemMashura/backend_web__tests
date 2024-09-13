import {
    Body,
    Controller,
    Get,
    Headers,
    HttpCode,
    HttpStatus,
    Injectable,
    NestInterceptor,
    ParseFilePipeBuilder,
    Post,
    Res,
    UnauthorizedException,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { FilesUploadS3Service } from 'src/services/files-upload-s3/files-upload-s3.service';
import { v4 } from 'uuid';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthMessage } from './messages/auth.message';
import { CreateUserDto } from 'src/global/dto/create-user.dto';
import { Tokens } from './types/tokens.type';
import * as argon from 'argon2';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../user/entities/user.entity';

@Controller('auth')
export class AuthController {
    accessTokenCookieKey: string;
    refreshTokenCookieKey: string;
    constructor(

        private readonly authService: AuthService,
        private readonly filesUploadS3Service: FilesUploadS3Service
    ) {
        this.accessTokenCookieKey = 'access_token';
        this.refreshTokenCookieKey = 'refresh_token';
    }

    @Post('register')
    @HttpCode(201)
    @UseInterceptors(FileInterceptor('avatar') as unknown as NestInterceptor)
    async create(
        @Body() createUser: CreateUserDto,
        // @UploadedFile(                    // разкоментить когда дадут баккет
        //     new ParseFilePipeBuilder()
        //         .addFileTypeValidator({
        //             fileType: /(jpg|jpeg|png|gif)$/,
        //         })
        //         .addMaxSizeValidator({
        //             maxSize: 2 * 1000 * 1000,
        //         })
        //         .build({
        //             errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        //         })
        // )
        // avatar: Express.Multer.File
    @Res() res: Response) {
        console.log(createUser);
        // console.log(avatar); // разкоментить когда дадут баккет

        // const profile_url = await this.filesUploadS3Service.uploadProfilePhoto(                                       // разкоментить когда дадут баккет
        //     `${createUser.nickname}/${v4()}.${avatar.mimetype.split('/')[1]}`, // Xepobopa/jasl3-vfk3a-fafo4-opiq3.png
        //     avatar.buffer
        // );

        const [newUser, tokens] = await this.authService.register(createUser,);        // разкоментить когда дадут баккет
        this.setATandRTCookies(res, tokens as Tokens);
        return res.json({ success: true, message: AuthMessage.successRegister, user: newUser, tokens: tokens });
    }

    @Post('login')
    @HttpCode(200)
    async login(@Body() login: LoginDto, @Res() res: Response) {
        const [user,tokens] = await this.authService.login(login);

        
        this.setATandRTCookies(res, tokens as Tokens);
        return res.json({
            success: true,
            message: AuthMessage.successLogin,
            user,
            tokens
        });
    }

    @Post('refresh-token')
    @HttpCode(200)
    async refreshToken(userId: number,
        @Headers('refresh_token') refreshTokenValue: string,
        @Res() res: Response
    ) {
        if (!refreshTokenValue) {
            throw new UnauthorizedException(AuthMessage.unauthorized);
        }

        const tokens:Tokens = await this.authService.refreshToken(refreshTokenValue);

        this.setATandRTCookies(res, tokens);

        return res.json({
            success: true,
            message: AuthMessage.refreshTokenSuccess,
            tokens: tokens
        });
    }

    @Post('logout')
    @HttpCode(204)
    async logout(
        @Headers('refresh_token') refreshTokenValue: string,
        @Res() res: Response
    ) {
        if (!refreshTokenValue) {
            throw new UnauthorizedException(AuthMessage.unauthorized);
        }
        console.log(1)
        await this.authService.logout(refreshTokenValue);
        console.log(11)
        // this.setATandRTCookies(res, tokens);

        return res.json()
    }

    private setATandRTCookies(
        res: Response,
        tokens: Tokens,
       
    ) {
        // set cookie with jwt access token to client browser
        res.cookie(this.accessTokenCookieKey, tokens.accessToken, {
            maxAge: 1000 * 60 * 60 * 24 * 7,
            sameSite: true,
            secure: false,
        });

        if (!tokens.refreshToken) return;
        // set cookie with jwt refresh token to client browser
        res.cookie(this.refreshTokenCookieKey, tokens.refreshToken, {
            maxAge: 1000 * 60 * 60 * 24 * 30,
            sameSite: true,
            secure: false,
        });
    }

    
}
