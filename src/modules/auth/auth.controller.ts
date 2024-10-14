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
    @UseInterceptors(FileInterceptor('file'))
    @HttpCode(201)
    async create(
        @Body() createUser: CreateUserDto,
        @UploadedFile(                   
            new ParseFilePipeBuilder()
                .addFileTypeValidator({
                    fileType: /(jpg|jpeg|png)$/,
                })
                .addMaxSizeValidator({
                    maxSize: 2 * 1000 * 1000,
                })
                .build({
                    errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
                })
        ) file: Express.Multer.File, @Res() res: Response)
        {
        
        

        const [newUser, tokens] = await this.authService.register(createUser, file);        // разкоментить когда дадут баккет
        this.setATandRTCookies(res, (tokens as Tokens).accessToken, (tokens as Tokens).refreshToken);
        return res.json({ success: true, message: AuthMessage.successRegister, user: newUser, tokens: tokens });
    }

    @Post('login')
    @HttpCode(200)
    async login(@Body() login: LoginDto, @Res() res: Response) {
        console.log("login start")
        const [user,tokens] = await this.authService.login(login);

        
        this.setATandRTCookies(res, (tokens as Tokens).accessToken, (tokens as Tokens).refreshToken);
        console.log(tokens)
        return res.json({
            success: true,
            message: AuthMessage.successLogin,
            user,
            tokens
        });
    }

    @Post('refresh-token')
    @HttpCode(200)
    async refreshToken(
        @Headers('refresh_token') refreshTokenValue: string,
        @Res() res: Response
    ) {
        if (!refreshTokenValue) {
            throw new UnauthorizedException(AuthMessage.unauthorized);
        }

        const at:string = await this.authService.refreshToken(refreshTokenValue);

        this.setATandRTCookies(res, at);

        return res.json({
            success: true,
            message: AuthMessage.refreshTokenSuccess,
            at
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
        await this.authService.logout(refreshTokenValue);
        // this.setATandRTCookies(res, tokens);

        return res.json()
    }

    private setATandRTCookies(res: Response, at:string, rt?:string) {
        // set cookie with jwt access token to client browser
        res.cookie(this.accessTokenCookieKey, at, {
            maxAge: 1000 * 60 * 60 * 24 * 7,
            sameSite: true,
            secure: false,
        });

        if (!rt) return;
        // set cookie with jwt refresh token to client browser
        res.cookie(this.refreshTokenCookieKey, rt, {
            maxAge: 1000 * 60 * 60 * 24 * 30,
            sameSite: true,
            secure: false,
        });
    }

    
}
