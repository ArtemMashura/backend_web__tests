import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatController } from './chat.controller';
import { TokenModule } from 'src/services/token/token.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomEntity } from './entities/room.dto';
import { UserModule } from '../user/user.module';
import { MessageEntity } from './entities/message.dto';

@Module({
    imports: [
        TypeOrmModule.forFeature([RoomEntity, MessageEntity]),
        UserModule,
        TokenModule,
    ],
    controllers: [ChatController],
    providers: [ChatGateway, ChatService],
})
export class ChatModule {}
