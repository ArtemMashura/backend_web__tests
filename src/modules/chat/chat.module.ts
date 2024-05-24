import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { UserModule } from '../user/user.module';

@Module({
    imports: [UserModule],
    providers: [ChatGateway, ChatService],
})
export class ChatModule {}
