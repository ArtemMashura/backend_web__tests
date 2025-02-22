import Configuration from "openai"
import OpenAIApi from "openai"
import OpenAI from "openai";
import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WsException } from '@nestjs/websockets';
import { createQueryBuilder, DeepPartial, DeleteResult, Repository } from 'typeorm';
import { UserEntity } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';
import { FilesUploadS3Service } from 'src/services/files-upload-s3/files-upload-s3.service';
import { v4 } from 'uuid';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { openAIChatMessageDto, openAIChatMessageInlineDto } from "./dto/openAIchatMessage";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import openai from "openAI/init";
import { OpenAIChatMessageEntity } from "./entities/openAI-message.entity";

@Injectable()
export class OpenAIChatService {
    constructor(
        @InjectRepository(OpenAIChatMessageEntity)
        private openAIChatMessageRepository: Repository<OpenAIChatMessageEntity>,
        @InjectRepository(UserEntity)
        private userRepository: Repository<UserEntity>,

    ) {}

    async createMessageInline (dto: openAIChatMessageInlineDto) {
        try {
        
            const requestMessages= [dto.request]

            console.log(requestMessages)
            
            const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: requestMessages // as ChatCompletionMessageParam[]
            });
    
            return {
                chatGptResponseMessage: completion.choices[0].message
            }
    }
        catch (err){
            console.log(err)
        }
    }

    async createMessage(dto: openAIChatMessageDto, uuid: string) {
        try {
        // const messagesFromDB = await this.openAIChatMessageRepository.createQueryBuilder('room')
        //     .leftJoinAndSelect('room.chatWith', 'user')
        //     .where('user.uuid = :uuid', { uuid: uuid })
        //     .getMany();

            const user = await this.userRepository.findOne({
                where: {
                    uuid: uuid
                }
            })
            
            const requestMessages= [...dto.messages, dto.newMessage]

            const userMessage = await this.openAIChatMessageRepository.save({
                ...dto.newMessage as DeepPartial<OpenAIChatMessageEntity>,
                date: new Date(),
                chatWith: user
            })
            

            const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: requestMessages // as ChatCompletionMessageParam[]
            });


            const chatGptResponseMessage = await this.openAIChatMessageRepository.save({
                ...completion.choices[0].message,
                date: new Date(),
                chatWith: user
            })
        
            return {
                userMessage: userMessage,
                chatGptResponseMessage: chatGptResponseMessage
            }
        }
        catch (err){
            console.log(err)
        }
    }

    async findByUid(uuid: string) {
        const dataFromDB = await this.openAIChatMessageRepository.createQueryBuilder('room')
            .leftJoin('room.chatWith', 'user')
            .where('user.uuid = :uuid', { uuid: uuid })
            .getMany();
        const sortedMessages = dataFromDB.sort((b, a) => a.created_at.getTime() - b.created_at.getTime())
        return sortedMessages
    }

    async clearHistory(uuid: string) {
        const user = await this.userRepository.findOne({
            where: {
                uuid: uuid
            }
        })
        return await this.openAIChatMessageRepository.delete({
            chatWith: user
        })
    
        // return await this.openAIChatMessageRepository.createQueryBuilder('room')
        //     .leftJoinAndSelect('room.chatWith', 'user')
        //     .delete()
        //     .from("room")
        //     .where('user.uuid = :uuid', { uuid: uuid })
        //     .execute()
    }
}