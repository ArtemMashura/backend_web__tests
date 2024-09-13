import { Body, Controller, Delete, Get, Param, Patch, Post, Req, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { Request } from 'express';
import { TokenService } from 'src/services/token/token.service';
import { ChatService } from './chat.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { WSNewMessageDto } from './dto/create-message.dto';
import { ChatGateway } from './chat.gateway';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('chat')
export class ChatController {
    constructor(
        private readonly chatService: ChatService,
        private readonly tokenService: TokenService,
        private readonly chatGateway: ChatGateway,
    ) {}

    @Post('create-room')
    async createRoom(@Body() roomDto: CreateRoomDto, @Req() req: Request, @Res() res: Response) {
        const token = req.headers.authorization.split(' ')[1];
        const user = this.tokenService.verifyToken(token, 'access');

        return this.chatService.createRoom(roomDto, user.uuid, res);
    }

    @Get('')
    async getAllRooms() {
        return await this.chatService.findAll();
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
    async newMessage(@Req() req: Request, @Body() newMessage: WSNewMessageDto, @UploadedFile() file: Express.Multer.File) {
        const token = req.headers.authorization.split(' ')[1];
        const user = this.tokenService.verifyToken(token, 'access');
        console.log(user)
        const message = await this.chatService.createMessage(newMessage, user.uuid, file);

        this.chatGateway.sendMessage(message);

        return message
    }

    @Patch('join-room/:room_uid')
    async joinRoom(@Req() req: Request, @Param('room_uid') roomUId: string) {
        const token = req.headers.authorization.split(' ')[1];
        const user = this.tokenService.verifyToken(token, 'access');

        return this.chatService.joinRoom(roomUId, user.uuid);
    }

    @Patch('leave-room/:room_uid')
    async leaveRoom(@Req() req: Request, @Param('room_uid') roomUId: string) {
        const token = req.headers.authorization.split(' ')[1];
        const user = this.tokenService.verifyToken(token, 'access');

        return this.chatService.leaveRoom(roomUId, user.uuid);
    }

    @Delete('delete-room/:room_uid')
    async deleteRoom(@Req() req: Request, @Param('room_uid') roomUId: string) {
        const token = req.headers.authorization.split(' ')[1];
        const user = this.tokenService.verifyToken(token, 'access');

        return this.chatService.deleteRoom(roomUId, user.uuid);
    }
}
