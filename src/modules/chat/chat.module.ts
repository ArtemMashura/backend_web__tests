import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatController } from './chat.controller';
import { TokenModule } from 'src/services/token/token.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomEntity } from './entities/room.dto';
import { UserModule } from '../user/user.module';

@Module({
    imports: [TypeOrmModule.forFeature([RoomEntity]), UserModule, TokenModule],
    providers: [ChatGateway, ChatController, ChatService],
})
export class ChatModule {}
