import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatController } from './chat.controller';
import { TokenModule } from 'src/services/token/token.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomEntity } from './entities/room.entity';
import { UserModule } from '../user/user.module';
import { MessageEntity } from './entities/message.entity';
import { FilesUploadS3Module } from 'src/services/files-upload-s3/files-upload-s3.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([RoomEntity, MessageEntity]),
        UserModule,
        TokenModule,
        FilesUploadS3Module,
    ],
    controllers: [ChatController],
    providers: [ChatGateway, ChatService],
})
export class ChatModule {}
