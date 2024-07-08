import { Controller, Get, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { Request } from 'express';
import { TokenService } from 'src/services/token/token.service';

@Controller('user')
export class UserController {
    constructor(
        private readonly userService: UserService,
        private readonly tokenService: TokenService
    ) {}

    @Get('my-rooms')
    async myRooms(@Req() req: Request) {
        const token = req.headers.authorization.split(' ')[1];
        console.log(token);
        const payload = this.tokenService.verifyToken(token, 'access');

        return this.userService.findChatsByUser(payload.uuid);
    }

    @Get('/findAll')
    async findAll() {
        return this.userService.findAll();
    }
}
