import {
    Body,
    Controller,
    Get,
    Headers,
    HttpCode,
    HttpStatus,
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
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { AuthMessage } from './messages/auth.message';

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
        @UploadedFile(
            new ParseFilePipeBuilder()
                .addFileTypeValidator({
                    fileType: /(jpg|jpeg|png|gif)$/,
                })
                .addMaxSizeValidator({
                    maxSize: 2 * 1000 * 1000,
                })
                .build({
                    errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
                })
        )
        avatar: Express.Multer.File
    ) {
        const profile_url = await this.filesUploadS3Service.uploadProfilePhoto(
            `${createUser.username}/${v4()}.${avatar.mimetype.split('/')[1]}`, // Xepobopa/jasl3-vfk3a-fafo4-opiq3.png
            avatar.buffer
        );

        await this.authService.create(createUser, profile_url);

        return { success: true, message: AuthMessage.successRegister };
    }

    @Post('login')
    @HttpCode(200)
    async login(@Body() login: LoginDto, @Res() res: Response) {
        const user = await this.authService.login(login);

        const { accessToken, refreshToken } =
            await this.authService.generateTokens(user.id, user.uuid);

        this.setATandRTCookies(res, accessToken, refreshToken);

        return res.json({
            success: true,
            message: AuthMessage.successLogin,
            user,
        });
    }

    @Get('refresh-token')
    @HttpCode(200)
    async refreshToken(
        @Headers('refresh_token') refreshTokenValue: string,
        @Res() res: Response
    ) {
        if (!refreshTokenValue) {
            throw new UnauthorizedException(AuthMessage.unauthorized);
        }

        const { accessToken, refreshToken } =
            await this.authService.refreshToken(refreshTokenValue);

        this.setATandRTCookies(res, accessToken, refreshToken);

        return res.json({
            success: true,
            message: AuthMessage.refreshTokenSuccess,
        });
    }

    private setATandRTCookies(
        res: Response,
        accessToken: string,
        refreshToken: string
    ) {
        // set cookie with jwt access token to client browser
        res.cookie(this.accessTokenCookieKey, accessToken, {
            maxAge: 1000 * 60 * 60 * 24 * 7,
            sameSite: true,
            secure: false,
        });

        // set cookie with jwt refresh token to client browser
        res.cookie(this.refreshTokenCookieKey, refreshToken, {
            maxAge: 1000 * 60 * 60 * 24 * 30,
            sameSite: true,
            secure: false,
        });
    }
}
