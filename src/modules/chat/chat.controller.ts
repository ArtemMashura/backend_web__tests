import { Body, Controller, Post, Headers } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { TokenService } from 'src/services/token/token.service';

@Controller('chat')
export class ChatController {
    constructor(
        private readonly chatService: ChatService,
        private readonly tokenService: TokenService
    ) {}

    @Post('create-room')
    async createRoom(
        @Body() roomDto: CreateRoomDto,
        @Headers('authrorization') token: string
    ) {
        const user = this.tokenService.verifyToken(token, 'access');

        return this.chatService.createRoom(roomDto, user.uuid);
    }
}
