import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Patch, Post, Req, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { Request } from 'express';
import { TokenService } from 'src/services/token/token.service';
import { DirectMessageService } from './direct-message.service';
import { CreateDirectMessageRoomDto } from './dto/create-direct-message-room.dto';
import { WSNewMessageDto } from './dto/create-message.dto';
import { DirectMessageGateway } from './direct-message.gateway';
import { FilesInterceptor } from '@nestjs/platform-express';
import { DirectMessageRoomEntity } from './entities/direct-message-room.entity';

@Controller('direct-message')
export class DirectMessageController {
    constructor(
        private readonly directMessageService: DirectMessageService,
        private readonly tokenService: TokenService,
        private readonly directMessageGateway: DirectMessageGateway,
    ) {}

    // @Post('create-room')
    // async createRoom(@Body() roomDto: CreateDirectMessageRoomDto, @Req() req: Request, @Res() res: Response) {
    //     const token = req.headers.authorization.split(' ')[1];
    //     const user = this.tokenService.verifyToken(token, 'access');

    //     return this.directMessageService.createRoom(roomDto, user.uuid, res);
    // }

    @Get('')
    async getAllRooms() {
        return await this.directMessageService.findAll();
    }

    @Get(':room_uid')
    async getRoomByUid(@Param('room_uid') roomUid: string) {
        return await this.directMessageService.findOneByUid(roomUid);
    }

    @Get('load-messages/:room_uid')
    async loadMessages(@Param('room_uid') roomUId: string) {
        return await this.directMessageService.loadMessages(roomUId);
    }

    @Post('message/:reciever_uuid')
    @UseInterceptors(FilesInterceptor('file'))
    async newMessage(@Req() req: Request, @Body() newMessage: WSNewMessageDto, @UploadedFile() file: Express.Multer.File, @Param("reciever_uuid") reciever_uuid: string) {
        const token = req.headers.authorization.split(' ')[1];
        const sender = this.tokenService.verifyToken(token, 'access');

        if (sender.uuid === reciever_uuid) throw new HttpException('Sender and reciever are the same person', HttpStatus.BAD_REQUEST)
            
        const message = await this.directMessageService.createMessage(newMessage, sender.uuid, reciever_uuid, file);

        this.directMessageGateway.sendMessage(message);

        return message
    }

    // @Patch('join-room/:room_uid')
    // async joinRoom(@Req() req: Request, @Param('room_uid') roomUId: string) {
    //     const token = req.headers.authorization.split(' ')[1];
    //     const user = this.tokenService.verifyToken(token, 'access');

    //     return this.directMessageService.joinRoom(roomUId, user.uuid);
    // }

    // @Patch('leave-room/:room_uid')
    // async leaveRoom(@Req() req: Request, @Param('room_uid') roomUId: string) {
    //     const token = req.headers.authorization.split(' ')[1];
    //     const user = this.tokenService.verifyToken(token, 'access');

    //     return this.directMessageService.leaveRoom(roomUId, user.uuid);
    // }

    // @Delete('delete-room/:room_uid')
    // async deleteRoom(@Req() req: Request, @Param('room_uid') roomUId: string) {
    //     const token = req.headers.authorization.split(' ')[1];
    //     const user = this.tokenService.verifyToken(token, 'access');

    //     return this.directMessageService.deleteRoom(roomUId, user.uuid);
    // }

    
}
