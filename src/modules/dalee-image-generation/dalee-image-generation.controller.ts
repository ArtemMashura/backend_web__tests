import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseFilePipeBuilder, Patch, Post, Req, Res, UploadedFile, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { Request, Response } from 'express';
import { TokenService } from 'src/services/token/token.service';
import { DaleeImageGenerationService } from './dalee-image-generation.service';
import { daleeImageGenerationDto } from './dto/dalee-image-generation,dto';

@Controller('dalee')
export class DaleeImageGenerationController {
    constructor(
        private readonly tokenService: TokenService,
        private readonly daleeImageGenerationService: DaleeImageGenerationService
    ) {}

    @Post('generate')
    // @UseInterceptors(FilesInterceptor('files'),)
    async newMessage(@Req() req: Request, @Body() dto: daleeImageGenerationDto) {
        const token = req.headers.authorization.split(' ')[1];
        const user = this.tokenService.verifyToken(token, 'access');
        console.log(dto)
        const messages = await this.daleeImageGenerationService.createImage(dto, user.uuid);

        
        // this.chatGateway.sendMessage(message);

        return messages
    }

    // @Get('load-messages')
    // // @UseInterceptors(FilesInterceptor('files'),)
    // async loadMessages(@Req() req: Request) {
    //     const token = req.headers.authorization.split(' ')[1];
    //     const user = this.tokenService.verifyToken(token, 'access');
    //     const messages = await this.daleeImageGenerationService.findByUid(user.uuid);

        
    //     // this.chatGateway.sendMessage(message);

    //     return {
    //         messages: messages
    //     }
    // }

    // @Delete('clear-history')
    // async clearHistory(@Req() req: Request) {
    //     const token = req.headers.authorization.split(' ')[1];
    //     const user = this.tokenService.verifyToken(token, 'access');

    //     return await this.daleeImageGenerationService.clearHistory(user.uuid)
    // }
}
