import { Module } from '@nestjs/common';
import { DirectMessageService } from './direct-message.service';
import { DirectMessageGateway } from './direct-message.gateway';
import { DirectMessageController } from './direct-message.controller';
import { TokenModule } from 'src/services/token/token.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DirectMessageRoomEntity } from './entities/direct-message-room.entity';
import { UserModule } from '../user/user.module';
import { MessageEntity } from '../chat/entities/message.entity';
import { FilesUploadS3Module } from 'src/services/files-upload-s3/files-upload-s3.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([DirectMessageRoomEntity, MessageEntity]),
        UserModule,
        TokenModule,
        FilesUploadS3Module,
    ],
    controllers: [DirectMessageController],
    providers: [DirectMessageGateway, DirectMessageService],
})
export class DirectMessageModule {}
