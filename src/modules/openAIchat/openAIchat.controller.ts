import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseFilePipeBuilder, Patch, Post, Req, Res, UploadedFile, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { Request, Response } from 'express';
import { TokenService } from 'src/services/token/token.service';
import { OpenAIChatService } from './openAIchat.service';
import { openAIChatMessageDto } from './dto/openAIchatMessage';

@Controller('chat-gpt')
export class OpenAIChatController {
    constructor(
        private readonly tokenService: TokenService,
        private readonly openAIChatService: OpenAIChatService
    ) {}

    @Post('message')
    // @UseInterceptors(FilesInterceptor('files'),)
    async newMessage(@Req() req: Request, @Body() dto: openAIChatMessageDto) {
        const token = req.headers.authorization.split(' ')[1];
        const user = this.tokenService.verifyToken(token, 'access');
        const message = await this.openAIChatService.createMessage(dto, user.uuid);

        
        // this.chatGateway.sendMessage(message);

        return message
    }

    @Get('load-messages')
    // @UseInterceptors(FilesInterceptor('files'),)
    async loadMessages(@Req() req: Request) {
        const token = req.headers.authorization.split(' ')[1];
        const user = this.tokenService.verifyToken(token, 'access');
        const message = await this.openAIChatService.findByUid(user.uuid);

        
        // this.chatGateway.sendMessage(message);

        return message
    }

    @Delete('clear-history')
    async clearHistory(@Req() req: Request) {
        const token = req.headers.authorization.split(' ')[1];
        const user = this.tokenService.verifyToken(token, 'access');

        return await this.openAIChatService.clearHistory(user.uuid)
    }
}
