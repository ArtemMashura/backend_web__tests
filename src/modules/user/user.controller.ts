import { Body, Controller, Delete, FileTypeValidator, Get, HttpCode, ParseFilePipe, Patch, Req, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { UserService } from './user.service';
import { Request } from 'express';
import { TokenService } from 'src/services/token/token.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('user')
export class UserController {
    constructor(
        private readonly userService: UserService,
        private readonly tokenService: TokenService
    ) {}

    @Get()
    async findUserByToken(@Req() req: Request) {
        const token = req.headers['authorization'].replace('Bearer ', '');
        const tokenPayload = this.tokenService.verifyToken(token, 'access');

        return this.userService.findOneByUid(tokenPayload.uuid);
    }

    @Get('my-rooms')
    async myRooms(@Req() req: Request) {
        const token = req.headers['authorization'].replace('Bearer ', '');
        const payload = this.tokenService.verifyToken(token, 'access');

        return this.userService.findChatsByUser(payload.uuid);
    }

    @Get('/findAll')
    async findAll() {
        return this.userService.findAll();
    }

    @Patch('change-password')
    @HttpCode(200)
    async changePassword(@Req() req: Request, @Body() updateUser: ChangePasswordDto){
        const token = req.headers['authorization'].replace('Bearer ', '');
        const user = this.tokenService.verifyToken(token, 'access');

        return this.userService.changePassword(updateUser, user.uuid);
        // res.json({ success: true });
    }

    @Patch('change-name')
    @HttpCode(200)
    async changeName(@Req() req: Request, @Body() updateUser: UpdateUserDto){
        const token = req.headers['authorization'].replace('Bearer ', '');
        const user = this.tokenService.verifyToken(token, 'access');

        return this.userService.changeName(updateUser, user.uuid);
        // res.json({ success: true });
    }

    @Patch('change-profile-picture')
    @HttpCode(200)
    @UseInterceptors(FileInterceptor('file'))
    async changeProfileUrl(@Req() req: Request, @UploadedFile(                   
                new ParseFilePipe({
                    validators: [
                        new FileTypeValidator({fileType: /(jpg|jpeg|png)$/})
                    ],
                    fileIsRequired: true
                })
            ) file: Express.Multer.File){
        const token = req.headers['authorization'].replace('Bearer ', '');
        const user = this.tokenService.verifyToken(token, 'access');

        return this.userService.changeProfilePicture(file, user.uuid);
        // res.json({ success: true });
    }

    @Delete('delete-account')
    @HttpCode(204)
    async deleteAccount(@Req() req: Request){
        const token = req.headers['authorization'].replace('Bearer ', '');
        const user = this.tokenService.verifyToken(token, 'access');
        console.log(user)
        return this.userService.deleteAccount(user.uuid);
        // res.json({ success: true });
    }
}
