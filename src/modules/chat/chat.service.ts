import { Injectable } from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { RoomEntity } from './entities/room.dto';
import { Repository } from 'typeorm';
import { UserService } from '../user/user.service';
import { UserEntity } from '../user/entities/user.entity';

@Injectable()
export class ChatService {
    constructor(
        @InjectRepository(RoomEntity)
        private roomRepository: Repository<RoomEntity>,
        private readonly userService: UserService
    ) {}

    async createRoom(newRoom: CreateRoomDto, ownerUid: string) {
        const owner: UserEntity = await this.userService.findOneByUid(ownerUid);
        const users: Array<UserEntity> = [];
        newRoom.users.forEach(async (userUid) => {
            users.push(await this.userService.findOneByUid(userUid));
        });

        return await this.roomRepository.save({
            name: newRoom.name,
            owner,
            users,
        });
    }
}
