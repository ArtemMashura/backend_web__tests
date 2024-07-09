import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WsException } from '@nestjs/websockets';
import { Repository } from 'typeorm';
import { UserEntity } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { WSJoinDto } from './dto/join.dto';
import { RoomEntity } from './entities/room.entity';
import { WSNewMessageDto } from './dto/create-message.dto';
import { MessageEntity } from './entities/message.entity';
import { FilesUploadS3Service } from 'src/services/files-upload-s3/files-upload-s3.service';
import { v4 } from 'uuid';

@Injectable()
export class ChatService {
    constructor(
        @InjectRepository(RoomEntity)
        private roomRepository: Repository<RoomEntity>,
        @InjectRepository(MessageEntity)
        private messageRepository: Repository<MessageEntity>,
        private readonly userService: UserService,
        private readonly fileUploadService: FilesUploadS3Service,
    ) {}

    async createMessage(newMessage: WSNewMessageDto, file: Express.Multer.File) {
        // find room
        const room = await this.findOneByUid(newMessage.toRoomUid);
        console.log('Room => ', room);
        if (!room) throw new WsException('Room not found');

        // find user
        const user = await this.userService.findOneByUid(newMessage.fromUid);
        // check if user is in room
        const isUserInRoom = room.users.some((u) => u.uuid === user.uuid);
        if (!isUserInRoom)
            throw new WsException('User is not a member of the room');

        // if file provided - save it in s3
        if (!file) {
            // save message
            const message = await this.messageRepository.save({
                ...newMessage,
                to: room,
                from: user,
                date: new Date(),
            });

            return message;
        }


        const file_url = await this.fileUploadService.uploadFile(
            `${newMessage.fromUid}/${v4()}.${file.mimetype.split('/')[1]}`,
            file.buffer,
        );

        const message = await this.messageRepository.save({
            ...newMessage,
            to: room,
            from: user,
            date: new Date(),
            file_url
        });

        return message;
    }

    async createRoom(newRoom: CreateRoomDto, ownerUid: string) {
        const owner: UserEntity = await this.userService.findOneByUid(ownerUid);
        const usersPromises = newRoom.users.map((userUid) => {
            return this.userService.findOneByUid(userUid);
        });
        const users: Array<UserEntity> = await Promise.all(usersPromises);

        return await this.roomRepository.save({
            name: newRoom.name,
            owner,
            users,
        });
    }

    async joinRoom(joinDto: WSJoinDto) {
        const room = await this.roomRepository.findOneBy({
            uuid: joinDto.roomUid,
        });
        if (!room) throw new WsException('Room not found');
        const user = await this.userService.findOneByUid(joinDto.userUid);
        const isUserInRoom = room.users.some((u) => u.uuid === user.uuid);
        if (isUserInRoom) throw new WsException('User already in room');

        room.users.push(user);
        await this.roomRepository.save(room);

        return user;
    }

    async findOneByUid(uuid: string) {
        return await this.roomRepository.findOneOrFail({
            where: { uuid },
            relations: ['users', 'owner'],
        });
    }

    async loadMessages(roomUId: string) {
        const room = await this.roomRepository.findOneBy({ uuid: roomUId });
        if (!room) throw new BadRequestException('Room not found');

        // return await this.messageRepository.find({
        //     where: { to: { uuid: roomUId } },
        //     relations: ['from'],
        // });

        return await this.messageRepository 
            .createQueryBuilder('message')
            .leftJoinAndSelect('message.to', 'to')
            .leftJoinAndSelect('message.from', 'from')
            .where('to.uuid = :uuid', { uuid: roomUId })
            .select([
                'message.id',
                'message.uuid',
                'message.date',
                'message.message',
                'message.file_url',
                'from.nickname',
                'from.profile_url',
                'from.uuid',
            ]).getMany();
    }

    // async newMessage(newMessage: CreateMessageDto, userUuid: string) {
    //     const fromUser = await this.userService.findOneByUid(userUuid);

    // }
}
