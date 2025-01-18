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
import { daleeImageGenerationDto } from "./dto/dalee-image-generation,dto";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import openai from "openAI/init";

@Injectable()
export class DaleeImageGenerationService {
    constructor(
    ) {}

    async createImage(dto: daleeImageGenerationDto, uuid: string) {
        console.log(dto.prompt)
        if (dto.prompt === "") {
            console.log("No prompt detected")
            return
        }
        try {
            const response = await openai.images.generate({
                model: "dall-e-2",
                prompt: dto.prompt,
                size: "256x256",
                quality: "standard",
                n: 1,
            })
            console.log(response.data[0])
            return {
                image: response.data[0]
            }
        }
        catch (err) {
            console.log(err)
        }
    }

}