import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WsException } from '@nestjs/websockets';
import { ArrayContains, ArrayOverlap, createQueryBuilder, DeleteResult, Repository } from 'typeorm';
import { UserEntity } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';
import { CreateDirectMessageRoomDto } from './dto/create-direct-message-room.dto';
// import { WSJoinDto } from './dto/join.dto';
import { DirectMessageRoomEntity } from './entities/direct-message-room.entity';
import { WSNewMessageDto } from './dto/create-message.dto';
import { MessageEntity } from '../chat/entities/message.entity';
import { FilesUploadS3Service } from 'src/services/files-upload-s3/files-upload-s3.service';
import { v4 } from 'uuid';

@Injectable()
export class DirectMessageService {
    constructor(
        @InjectRepository(DirectMessageRoomEntity)
        private directMessageRoomRepository: Repository<DirectMessageRoomEntity>,
        @InjectRepository(MessageEntity)
        private messageRepository: Repository<MessageEntity>,
        private readonly userService: UserService,
        private readonly fileUploadService: FilesUploadS3Service,
    ) {}

    async createMessage(newMessage: WSNewMessageDto, userUuid:string, recieverUUid:string, file: Express.Multer.File) {
        // find room
        const foundRoom = await this.findARoomFrom2Users(userUuid, recieverUUid);
        console.log('Room => ', foundRoom);
        const room = foundRoom || await this.createRoom({
            users: [userUuid, recieverUUid]
        })
        
        

        // find user
        const user = await this.userService.findOneByUid(userUuid);
        if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND)

        // check if user is in room
        // const isUserInRoom = room.users.some((u) => u.uuid === user.uuid);
        // if (!isUserInRoom)
        //     throw new WsException('User is not a member of the room');

        // if file provided - save it in s3
        if (!file) {
            // save message
            const message = await this.messageRepository.save({
                ...newMessage,
                toDirectMessageRoomUUid: room.uuid,
                toDirectMessageRoom: room,
                from: user,
                date: new Date(),
            });

            return message;
        }


        const file_url = await this.fileUploadService.uploadFile(
            `${userUuid}/${v4()}.${file.mimetype.split('/')[1]}`,
            file.buffer,
            file.mimetype
        );

        const message = await this.messageRepository.save({
            ...newMessage,
            toDirectMessageRoomUUid: room.uuid,
            from: user,
            date: new Date(),
            file_url
        });

        return message;
    }

    async createRoom(newRoom: CreateDirectMessageRoomDto) {
        const usersPromises = newRoom.users.map((userUid) => {
            return this.userService.findOneByUid(userUid);
        });
        const users: Array<UserEntity> = await Promise.all(usersPromises);
        console.log(users)
        return await this.directMessageRoomRepository.save({
            users,
        });
    }

    // async joinRoom(roomUId: string, userUuid: string) {
    //     const room = await this.directMessageRoomRepository.createQueryBuilder("room")
    //         .leftJoinAndSelect("room.users", "user")
    //         .where("room.uuid = :roomUId", {roomUId: roomUId})
    //         .getOne()
    //     // const room = await this.directMessageRoomRepository.findOneBy({
            
    //     //     where: {
    //     //         uuid: roomUId
    //     //     },
    //     // });
    //     if (!room)   throw new HttpException('Chat not found', HttpStatus.NOT_FOUND);
    //     const user = await this.userService.findOneByUid(userUuid);
        
    //     const isUserInRoom = room.users.some((u) => u.uuid === user.uuid);
    //     if (isUserInRoom) throw new HttpException('User already in room', HttpStatus.CONFLICT);

    //     room.users.push(user);
    //     await this.directMessageRoomRepository.save(room);

    //     return user;
    // }

    // async leaveRoom(roomUId: string, userUuid: string) {
    //     // const room = await this.directMessageRoomRepository.createQueryBuilder("room")
    //     //     .leftJoinAndSelect("room.users", "user")
    //     //     .where("room.uuid = :roomUId", {roomUId: roomUId})
    //     //     .getOne()
        
    //     const room = await this.directMessageRoomRepository.findOneOrFail({
    //         where: {uuid: roomUId },
    //         relations: ['users', 'owner'],
    //     });
    //     console.log(room)
    //     if (!room)   throw new HttpException('Chat not found', HttpStatus.NOT_FOUND);
    //     const user = await this.userService.findOneByUid(userUuid);

    //     const isUserInRoom = room.users.some((u) => u.uuid === user.uuid);
    //     if (!isUserInRoom)   throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    //     // if (room.owner.uuid === userUuid) {
    //     //     this.deleteRoom(roomUId, userUuid)
    //     // }
    //     else {
    //         const index = room.users.indexOf(user)
    //         room.users.splice(index, 1);
    //         await this.directMessageRoomRepository.save(room);

    //         return user;
    //     }
        
    // }

    async findOneByUid(uuid: string) {
        return await this.directMessageRoomRepository.findOneOrFail({
            where: { uuid },
            relations: ['users', 'messages'],
        });
    }

    async findAll() {
        return await this.directMessageRoomRepository.find({
            relations: ['users', 'messages'],
        });
    }

    // async deleteRoom(roomUId: string, userUuid: string) {
    //     const room = await this.directMessageRoomRepository.findOne({
    //         where: {uuid: roomUId },
    //         relations: ['users', 'owner'],
    //     });
    //     // const room = await this.directMessageRoomRepository.createQueryBuilder("room")
    //     //     .leftJoinAndSelect("room.users", "user")
    //     //     .where("room.uuid = :roomUId", {roomUId: roomUId})
    //     //     .getOne()
        
    //     if (!room)   throw new HttpException('Chat not found', HttpStatus.NOT_FOUND);

    //     // const room_owner_out_of_db = await this.directMessageRoomRepository.createQueryBuilder("room")
    //     //     .leftJoinAndSelect("room.owner", "user")
    //     //     .where("room.uuid = :roomUId", {roomUId: roomUId})
    //     //     .getOne()
        
    //     // const room_owner = room_owner_out_of_db.owner
    //     // console.log(room_owner)
    //     if (room.owner.uuid !== userUuid) throw new HttpException('Only owner can delete the chat', HttpStatus.FORBIDDEN);

    //     // const query = await this.directMessageRoomRepository.createQueryBuilder("room")
    //     //     .leftJoinAndSelect("room.users", "user")
    //     //     .where("room.uuid = :roomUId", {roomUId: roomUId})
    //     //     .delete()
    //     //     .from("room")
    //     //     .where("room.users")
    //     //     .execute()
        
    //     // console.log(query)

    //     // const query = await createQueryBuilder("user_chats_room")
    //     //     .where("roomId = :roomId", {roomId: room.id})
    //     //     .delete()

    //     // console.log(query)

    //     room.users = []
    //     await this.directMessageRoomRepository.save(room);

    //     // const messages1 = await this.messageRepository.find({
    //     //     relations: ["to"]
    //     // });
    //     // console.log(messages1)

    //     // const messages = await this.messageRepository.find({
    //     //     relations: ["to"],
    //     //     where: {to: room },
    //     // });
    //     // messages.forEach(message => {
    //     //     message.to = null;
    //     // });
    //     // console.log(messages)
    //     // await this.messageRepository.save(messages)

    //     const deletedRoom: DeleteResult = await this.directMessageRoomRepository.delete({uuid: roomUId});
    //     return deletedRoom;
    // }

    async loadMessages(roomUId: string) {
        const room = await this.directMessageRoomRepository.findOneBy({ uuid: roomUId });
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

    async findARoomFrom2Users(user1: string, user2: string): Promise<DirectMessageRoomEntity>{
        // const rooms = await this.directMessageRoomRepository.createQueryBuilder("direct_message_room")
        //     .leftJoinAndSelect("direct_message_room.users", "user")
        //     .where("user.uuid = :user1", {user1: user1})
        //     .andWhere("user.uuid = :user2", {user2: user2})
        //     .getMany()
        
        
        // rooms[0].users.forEach(u => {
        //     console.log(u.uuid === user1)
        //     console.log(u.uuid === user2)
        // })

        // const room = await this.directMessageRoomRepository.createQueryBuilder("direct_message_room")
        //     .leftJoinAndSelect("direct_message_room.users", "user")
        //     .where("user.uuid = :user1", {user1: user1})
        //     .andWhere("user.uuid = :user2", {user2: user2})
        //     .getOne()

        const rooms = await this.directMessageRoomRepository.createQueryBuilder("direct_message_room")
            .leftJoinAndSelect("direct_message_room.users", "user")
            .where("user.uuid = :user1", {user1: user1})
            .orWhere("user.uuid = :user2", {user2: user2})
            .getMany()

        // const room = await createQueryBuilder("user_direct_message_rooms_direct_message_room")
        //     .
        console.log(rooms)
        const room = this.sortThroughDirectMessageRooms(rooms, user1, user2)
        return room
    }

    sortThroughDirectMessageRooms(rooms:DirectMessageRoomEntity[], user1:string, user2:string): DirectMessageRoomEntity {
        let foundRoom = null
        rooms.forEach(room => {
            const checker_array = [room.users[0].uuid, room.users[1].uuid]
            console.log(checker_array)
            console.log(checker_array.includes(user1))
            console.log(checker_array.includes(user2))
            if (checker_array.includes(user1) && checker_array.includes(user2)){
                foundRoom = room
                return
            }
        })
        return foundRoom
    }

    // async newMessage(newMessage: CreateMessageDto, userUuid: string) {
    //     const fromUser = await this.userService.findOneByUid(userUuid);

    // }
}
