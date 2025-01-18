import { Body, Controller, Delete, FileTypeValidator, Get, HttpCode, HttpStatus, MaxFileSizeValidator, Param, ParseFilePipe, ParseFilePipeBuilder, Patch, Post, Req, Res, UploadedFile, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { Request, Response } from 'express';
import { TokenService } from 'src/services/token/token.service';
import { ChatService } from './chat.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { WSNewMessageDto } from './dto/create-message.dto';
import { ChatGateway } from './chat.gateway';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { retry } from 'rxjs';
import { ChangeRoomNameDto } from './dto/change-room-name.dto';
import { DeleteMessagesDto } from './dto/delete-messages.dto';

@Controller('chat')
export class ChatController {
    constructor(
        private readonly chatService: ChatService,
        private readonly tokenService: TokenService,
        private readonly chatGateway: ChatGateway,
    ) {}

    @UseInterceptors(FileInterceptor('file'))
    @Post('create-room')
    @HttpCode(201)
    async createRoom(@Body() roomDto: CreateRoomDto, @Req() req: Request, @Res() res: Response, @UploadedFile(                   
        new ParseFilePipe({
            validators: [
                // new MaxFileSizeValidator({ maxSize: 2 * 1000 * 1000 }),
                new FileTypeValidator({fileType: /(jpg|jpeg|png)$/})
            ],
            fileIsRequired: false
        })
    ) file?: Express.Multer.File) {
        const token = req.headers.authorization.split(' ')[1];
        const user = this.tokenService.verifyToken(token, 'access');
        console.log(roomDto)
        const chatInfo = await this.chatService.createRoom(roomDto, user.uuid, file);
        return res.json({
            success: true,
            chatInfo: chatInfo
        });
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
    @UseInterceptors(FilesInterceptor('files'),)
    async newMessage(@UploadedFiles() files: Express.Multer.File[], @Req() req: Request, @Body() newMessage: WSNewMessageDto) {
        const token = req.headers.authorization.split(' ')[1];
        const user = this.tokenService.verifyToken(token, 'access');
        const message = await this.chatService.createMessage(newMessage, user.uuid, files);

        console.log(message)
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

    @Patch('change-name/:room_uid')
    @HttpCode(200)
    async changeName(@Req() req: Request, @Param('room_uid') roomUId: string, @Body() changeNameDto: ChangeRoomNameDto) {
        const token = req.headers.authorization.split(' ')[1];
        const user = this.tokenService.verifyToken(token, 'access');

        const newName = await this.chatService.changeRoomName(roomUId, changeNameDto.newName, user.uuid);
        this.chatGateway.chatNameChange(newName.roomNewName, roomUId);

        return newName
    }

    @Patch('change-avatar/:room_uid')
    @HttpCode(200)
    @UseInterceptors(FileInterceptor('file'))
    async changeAvatar(@Req() req: Request, @Param('room_uid') roomUId: string, @UploadedFile(                   
        new ParseFilePipe({
            validators: [
                // new MaxFileSizeValidator({ maxSize: 2 * 1000 * 1000 }),
                new FileTypeValidator({fileType: /(jpg|jpeg|png)$/})
            ],
            fileIsRequired: true
        })
    ) file: Express.Multer.File) {
        const token = req.headers.authorization.split(' ')[1];
        const user = this.tokenService.verifyToken(token, 'access');

        

        const newAvatar = await this.chatService.changeAvatar(file, roomUId);
        this.chatGateway.chatAvatarChange(newAvatar.new_logo_url, roomUId);

        return newAvatar
    }

    @Patch('change-background/:room_uid')
    @HttpCode(200)
    @UseInterceptors(FileInterceptor('file'))
    async changeBackground(@Req() req: Request, @Param('room_uid') roomUId: string, @UploadedFile(                   
        new ParseFilePipe({
            validators: [
                // new MaxFileSizeValidator({ maxSize: 2 * 1000 * 1000 }),
                new FileTypeValidator({fileType: /(jpg|jpeg|png)$/})
            ],
            fileIsRequired: true
        })
    ) file: Express.Multer.File) {
        const token = req.headers.authorization.split(' ')[1];
        const user = this.tokenService.verifyToken(token, 'access');

        

        const newBackground = await this.chatService.changeBackground(file, roomUId);
        this.chatGateway.chatBackgroundChange(newBackground.new_background_url, roomUId);

        return newBackground
    }

    @Delete('delete-messages/:room_uid')
    @HttpCode(204)
    async deleteMessages(@Req() req: Request, @Param('room_uid') roomUId: string, @Body() deleteMessagesDto: DeleteMessagesDto) {
        const token = req.headers.authorization.split(' ')[1];
        const user = this.tokenService.verifyToken(token, 'access');

        this.chatService.deleteMessages(deleteMessagesDto.messagesUUIDArray, roomUId);

        this.chatGateway.messageDeletion(deleteMessagesDto.messagesUUIDArray, roomUId);

        return
    }
}
