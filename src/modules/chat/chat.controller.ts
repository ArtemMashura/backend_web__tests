import { Body, Controller, Post, Req } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { TokenService } from 'src/services/token/token.service';
import { Request } from 'express';

@Controller('chat')
export class ChatController {
    constructor(
        private readonly chatService: ChatService,
        private readonly tokenService: TokenService
    ) {}

    @Post('create-room')
    async createRoom(@Body() roomDto: CreateRoomDto, @Req() req: Request) {
        const token = req.headers.authorization.split(' ')[1];
        const user = this.tokenService.verifyToken(token, 'access');

        return this.chatService.createRoom(roomDto, user.uuid);
    }
}
