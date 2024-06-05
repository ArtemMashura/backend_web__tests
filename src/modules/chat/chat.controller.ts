import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { TokenService } from 'src/services/token/token.service';
import { ChatService } from './chat.service';
import { CreateRoomDto } from './dto/create-room.dto';

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

    @Get(':room_uid')
    async getRoomByUid(@Param('room_uid') roomUid: string) {
        return await this.chatService.findOneByUid(roomUid);
    }

    @Get('load-messages/:room_uid')
    async loadMessages(@Param('room_uid') roomUId: string) {
        return await this.chatService.loadMessages(roomUId);
    }

    // @Post('new-message')
    // // eslint-disable-next-line prettier/prettier
    // async newMessage(@Body() newMessage: CreateMessageDto, @Req() req: Request) {
    //     const token = req.headers.authorization.split(' ')[1];
    //     const user = this.tokenService.verifyToken(token, 'access');

    //     return this.chatService.newMessage(newMessage, user.uuid);
    // }
}
