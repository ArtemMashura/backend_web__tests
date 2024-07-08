import { Body, Controller, Get, Param, Post, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { Request } from 'express';
import { TokenService } from 'src/services/token/token.service';
import { ChatService } from './chat.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { WSJoinDto } from './dto/join.dto';
import { WSNewMessageDto } from './dto/create-message.dto';
import { ChatGateway } from './chat.gateway';
import { Events } from './dto/events.enum';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('chat')
export class ChatController {
    constructor(
        private readonly chatService: ChatService,
        private readonly tokenService: TokenService,
        private readonly chatGateway: ChatGateway,
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

    @Post('message')
    @UseInterceptors(FilesInterceptor('file'))
    async newMessage(@Body() newMessage: WSNewMessageDto, @UploadedFile() file: Express.Multer.File) {
        console.log(newMessage);
        const message = await this.chatService.createMessage(newMessage, file);

        this.chatGateway.sendMessage(message);
    }
}
