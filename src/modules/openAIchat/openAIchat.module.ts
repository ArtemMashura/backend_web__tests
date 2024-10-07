import { Module } from '@nestjs/common';
import { TokenModule } from 'src/services/token/token.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';
import { FilesUploadS3Module } from 'src/services/files-upload-s3/files-upload-s3.module';
import { OpenAIChatService } from './openAIchat.service';
import { OpenAIChatController } from './openAIchat.controller';
import { UserEntity } from '../user/entities/user.entity';
import { OpenAIChatMessageEntity } from './entities/openAI-message.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([OpenAIChatMessageEntity, UserEntity]),
        UserModule,
        TokenModule,
        FilesUploadS3Module,
    ],
    controllers: [OpenAIChatController],
    providers: [OpenAIChatService],
})
export class OpenAIChatModule {}
