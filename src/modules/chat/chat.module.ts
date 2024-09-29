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
import { MulterModule } from '@nestjs/platform-express';
import { ConnectedUserService } from '../connected-user/connected-user.service';
import { ConnectedUserEntity } from '../connected-user/entities/connected-user-entity';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            RoomEntity,
            MessageEntity, 
            ConnectedUserEntity,

        ]),
        UserModule,
        TokenModule,
        FilesUploadS3Module,
        MulterModule.register(),
        EventEmitterModule.forRoot({
            maxListeners: 1
        })
    ],
    controllers: [ChatController],
    providers: [ChatGateway, ChatService, ConnectedUserService],
})
export class ChatModule {}
