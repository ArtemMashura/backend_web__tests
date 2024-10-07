import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenModule } from 'src/services/token/token.module';
import { UserEntity } from './entities/user.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { RoomEntity } from '../chat/entities/room.entity';
import { OpenAIChatMessageEntity } from '../openAIchat/entities/openAI-message.entity';

@Module({
    imports: [TypeOrmModule.forFeature([UserEntity, RoomEntity, OpenAIChatMessageEntity]), TokenModule],
    controllers: [UserController],
    providers: [UserService],
    exports: [UserService],
})
export class UserModule {}
