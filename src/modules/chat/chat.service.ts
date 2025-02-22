import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WsException } from '@nestjs/websockets';
import { createQueryBuilder, DeleteResult, Repository } from 'typeorm';
import { UserEntity } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { WSJoinDto } from './dto/join.dto';
import { RoomEntity } from './entities/room.entity';
import { WSNewMessageDto } from './dto/create-message.dto';
import { MessageEntity } from './entities/message.entity';
import { FilesUploadS3Service } from 'src/services/files-upload-s3/files-upload-s3.service';
import { v4 } from 'uuid';
import { ChatGateway } from './chat.gateway';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FileEntity } from './entities/file-url.entity';

@Injectable()
export class ChatService {
    constructor(
        @InjectRepository(RoomEntity)
        private roomRepository: Repository<RoomEntity>,
        @InjectRepository(MessageEntity)
        private messageRepository: Repository<MessageEntity>,
        @InjectRepository(FileEntity)
        private fileRepository: Repository<FileEntity>,
        private readonly userService: UserService,
        private readonly filesUploadS3Service: FilesUploadS3Service,
        private eventEmitter: EventEmitter2
    ) {}

    async createMessage(newMessage: WSNewMessageDto, userUuid:string, files: Express.Multer.File[]) {
        // find room
        const room = await this.findOneByUid(newMessage.toRoomUid);
        if (!room) throw new WsException('Room not found');

        // find user
        const user = await this.userService.findOneByUid(userUuid);
        // check if user is in room
        const isUserInRoom = room.users.some((u) => u.uuid === user.uuid);
        if (!isUserInRoom)
            throw new WsException('User is not a member of the room');

        // if file provided - save it in s3
        if (!files) {
            // save message
            const message = await this.messageRepository.save({
                ...newMessage,
                to: room,
                from: user,
                date: new Date(),
            });

            

            return message;
        }

        var files_urls_promises = []
        files.forEach(file => {
            files_urls_promises.push(this.filesUploadS3Service.uploadFile(
                `${userUuid}/${v4()}.${file.mimetype.split('/')[1]}`,
                file.buffer,
                file.mimetype
            ))
        });

        var files_urls = await Promise.all(files_urls_promises)

        const message = await this.messageRepository.save({
            ...newMessage,
            to: room,
            from: user,
            date: new Date(),
        });

        const filesToSave = files_urls.map(file_url => ({
            file_url: file_url,
            message: message,
        }));

        const filesInDB = this.fileRepository.create(filesToSave);
        await this.fileRepository.insert(filesInDB);
        // const filesInDB = await this.fileRepository.createQueryBuilder()
        // .insert()
        // .into(FileEntity)
        // .values(filesToSave)
        // .execute();

        return {
            ...message,
            files_urls: filesInDB
        };
    }

    async createRoom(newRoom: CreateRoomDto, ownerUid: string, file: Express.Multer.File) {
        const owner: UserEntity = await this.userService.findOneByUid(ownerUid);
        if (!newRoom.users.includes(ownerUid)) {
            throw new HttpException({
                status: HttpStatus.FORBIDDEN,
                error: "Wrong chat creation parameters, owner isn't included in the chat",
            }, HttpStatus.FORBIDDEN, {
                cause: "Owner isn't included in the chat"
            });
        }
        const usersPromises = newRoom.users.map((userUid) => {
            return this.userService.findOneByUid(userUid);
        });
        const users: Array<UserEntity> = await Promise.all(usersPromises);
        if (file) {
            var file_url = await this.filesUploadS3Service.uploadFile(
                `${ownerUid}/${v4()}.${file.mimetype.split('/')[1]}`,
                file.buffer,
                file.mimetype
            );
        }

        const createdRoom = await this.roomRepository.save({
            name: newRoom.name,
            logo_url: file_url || null,
            owner,
            users,
        });

        this.eventEmitter.emit(
            'createRoom',
            createdRoom
          );
        
        return createdRoom 
    }

    async joinRoom(roomUId: string, userUuid: string) {
        const room = await this.roomRepository.createQueryBuilder("room")
            .leftJoinAndSelect("room.users", "user")
            .where("room.uuid = :roomUId", {roomUId: roomUId})
            .getOne()
        console.log(room)
        // const room = await this.roomRepository.findOneBy({
            
        //     where: {
        //         uuid: roomUId
        //     },
        // });
        if (!room)   throw new HttpException('Chat not found', HttpStatus.NOT_FOUND);
        const user = await this.userService.findOneByUid(userUuid);
        
        const isUserInRoom = room.users.some((u) => u.uuid === user.uuid);
        if (isUserInRoom) throw new HttpException('User already in room', HttpStatus.CONFLICT);

        room.users.push(user);
        await this.roomRepository.save(room);

        return user;
    }

    async leaveRoom(roomUId: string, userUuid: string) {
        // const room = await this.roomRepository.createQueryBuilder("room")
        //     .leftJoinAndSelect("room.users", "user")
        //     .where("room.uuid = :roomUId", {roomUId: roomUId})
        //     .getOne()
        
        const room = await this.roomRepository.findOneOrFail({
            where: {uuid: roomUId },
            relations: ['users', 'owner'],
        });
        console.log(room)
        if (!room)   throw new HttpException('Chat not found', HttpStatus.NOT_FOUND);
        const user = await this.userService.findOneByUid(userUuid);

        const isUserInRoom = room.users.some((u) => u.uuid === user.uuid);
        if (!isUserInRoom)   throw new HttpException('User not found', HttpStatus.NOT_FOUND);

        if (room.owner.uuid === userUuid) {
            this.deleteRoom(roomUId, userUuid)
        }
        else {
            const index = room.users.indexOf(user)
            room.users.splice(index, 1);
            await this.roomRepository.save(room);

            return user;
        }
        
    }

    async findOneByUid(uuid: string) {
        var dataFromDB = await this.roomRepository.findOneOrFail({
            where: { uuid },
            relations: ['users', 'owner', 'messages'],
        });
        const sortedMessages = dataFromDB.messages.sort((b, a) => a.created_at.getTime() - b.created_at.getTime())
        dataFromDB.messages = sortedMessages
        return dataFromDB
    }

    async findAll() {
        console.log(1)
        return await this.roomRepository.find({
            relations: ['users', 'owner', 'messages'],
        });
    }

    async deleteRoom(roomUId: string, userUuid: string) {
        const room = await this.roomRepository.findOne({
            where: {uuid: roomUId },
            relations: ['users', 'owner'],
        });
        // const room = await this.roomRepository.createQueryBuilder("room")
        //     .leftJoinAndSelect("room.users", "user")
        //     .where("room.uuid = :roomUId", {roomUId: roomUId})
        //     .getOne()
        
        if (!room)   throw new HttpException('Chat not found', HttpStatus.NOT_FOUND);

        // const room_owner_out_of_db = await this.roomRepository.createQueryBuilder("room")
        //     .leftJoinAndSelect("room.owner", "user")
        //     .where("room.uuid = :roomUId", {roomUId: roomUId})
        //     .getOne()
        
        // const room_owner = room_owner_out_of_db.owner
        // console.log(room_owner)
        if (room.owner.uuid !== userUuid) throw new HttpException('Only owner can delete the chat', HttpStatus.FORBIDDEN);

        // const query = await this.roomRepository.createQueryBuilder("room")
        //     .leftJoinAndSelect("room.users", "user")
        //     .where("room.uuid = :roomUId", {roomUId: roomUId})
        //     .delete()
        //     .from("room")
        //     .where("room.users")
        //     .execute()
        
        // console.log(query)

        // const query = await createQueryBuilder("user_chats_room")
        //     .where("roomId = :roomId", {roomId: room.id})
        //     .delete()

        // console.log(query)

        room.users = []
        room.messages = []

        await this.roomRepository.save(room);

        // const messages1 = await this.messageRepository.find({
        //     relations: ["to"]
        // });
        // console.log(messages1)

        // const messages = await this.messageRepository.find({
        //     relations: ["to"],
        //     where: {to: room },
        // });
        // messages.forEach(message => {
        //     message.to = null;
        // });
        // console.log(messages)
        // await this.messageRepository.save(messages)

        const deletedRoom: DeleteResult = await this.roomRepository.delete({uuid: roomUId});
        return deletedRoom;
    }

    async loadMessages(roomUId: string) {
        const room = await this.roomRepository.findOneBy({ uuid: roomUId });
        if (!room) throw new BadRequestException('Room not found');

        // return await this.messageRepository.find({
        //     where: { to: { uuid: roomUId } },
        //     relations: ['from'],
        // });
        const messagesFromDB = await this.messageRepository 
        .createQueryBuilder('message')
        .leftJoinAndSelect('message.to', 'to')
        .leftJoinAndSelect('message.from', 'from')
        .leftJoinAndSelect('message.files_urls', 'files_urls')
        .where('to.uuid = :uuid', { uuid: roomUId })
        // .select([
        //     'message.id',
        //     'message.uuid',
        //     'message.date',
        //     'message.message',
        //     'from.nickname',
        //     'from.profile_url',
        //     'from.uuid',
        //     'files_urls',
        //     'files_urls.file_url'
        // ])
        .getMany();
        const messages = messagesFromDB.sort((a, b) => a.created_at.getTime() - b.created_at.getTime())
        return messages
    }

    async changeRoomName(roomUId: string, newName: string, userUuid: string) {
        // const room = await this.roomRepository.createQueryBuilder("room")
        //     .leftJoinAndSelect("room.users", "user")
        //     .where("room.uuid = :roomUId", {roomUId: roomUId})
        //     .getOne()
        
        const room = await this.roomRepository.findOneOrFail({
            where: {uuid: roomUId },
            relations: ['users', 'owner'],
        });

        if (!room)   throw new HttpException('Chat not found', HttpStatus.NOT_FOUND);
        const user = await this.userService.findOneByUid(userUuid);

        const isUserInRoom = room.users.some((u) => u.uuid === user.uuid);
        if (!isUserInRoom)   throw new HttpException('User not found', HttpStatus.NOT_FOUND);

        room.name = newName
        this.roomRepository.save(room);
        return {
            roomNewName: newName
        }
    }

    async changeAvatar(file: Express.Multer.File, roomUId: string) {
        if (!file){
            throw new BadRequestException('No new profile picture provided'); 
        }
        const room = await this.roomRepository.findOne({
            where: {
                uuid: roomUId
            }
        })
        if (!room)   throw new HttpException('Room not found', HttpStatus.NOT_FOUND);
    
        var logo_url = await this.filesUploadS3Service.uploadProfilePhoto(                                       
            `${room.name}/${v4()}.${file.mimetype.split('/')[1]}`, // Xepobopa/jasl3-vfk3a-fafo4-opiq3.png
            file.buffer,
            file.mimetype
        );
    
        room.logo_url = logo_url

        await this.roomRepository.save(room);

        return {
            new_logo_url: logo_url
        }
    }

    async changeBackground(file: Express.Multer.File, roomUId: string) {
        if (!file){
            throw new BadRequestException('No new profile picture provided'); 
        }
        const room = await this.roomRepository.findOne({
            where: {
                uuid: roomUId
            }
        })
        if (!room)   throw new HttpException('Room not found', HttpStatus.NOT_FOUND);
    
        var background_url = await this.filesUploadS3Service.uploadProfilePhoto(                                       
            `${room.name}/${v4()}.${file.mimetype.split('/')[1]}`, // Xepobopa/jasl3-vfk3a-fafo4-opiq3.png
            file.buffer,
            file.mimetype
        );
    
        room.background_url = background_url

        await this.roomRepository.save(room);

        return {
            new_background_url: background_url
        }
    }

    async deleteMessages(messages: string[], roomUId: string) {
        const room = await this.roomRepository.findOne({
            where: {
                uuid: roomUId
            },
            relations: ['messages']
            
        })
        if (!room)   throw new HttpException('Room not found', HttpStatus.NOT_FOUND);

        console.log(room.messages.length)

        room.messages = room.messages.filter(function(el) {
            return !messages.includes(el.uuid);
        });

        console.log(room.messages.length)

        this.roomRepository.save(room);

        return 
    }

    async deleteAllMessages(roomUId: string) {
        const room = await this.roomRepository.findOne({
            where: {uuid: roomUId },
            relations: ['messages'],
        });
        
        if (!room)   throw new HttpException('Chat not found', HttpStatus.NOT_FOUND);

        room.messages = []

        await this.roomRepository.save(room);

        return;
    }

    async addUsersToTheRoom(users: string[], roomUId: string) {
        const room = await this.roomRepository.findOne({
            where: {
                uuid: roomUId,
            },
            relations: ['users']
        })
        if (!room)   throw new HttpException('Room not found', HttpStatus.NOT_FOUND);
    
        const usersPromises = users.map((userUid) => {
            return this.userService.findOneByUid(userUid);
        });
        const newUsers: Array<UserEntity> = await Promise.all(usersPromises);
        room.users = [...room.users, ...newUsers]
        await this.roomRepository.save(room);

        return {
            newUsers: newUsers
        }
    }

    async deleteUserFromTheRoom(userUUID: string, roomUId: string) {
        const room = await this.roomRepository.findOne({
            where: {
                uuid: roomUId
            },
            relations: ['users']
        })
        if (!room)   throw new HttpException('Room not found', HttpStatus.NOT_FOUND);
    
        // const userToDelete = await this.userService.findOneByUid(userUid);

        room.users = room.users.filter((user) => user.uuid !== userUUID);
        
        await this.roomRepository.save(room);

        return
    }

    async editMessage(userUUID: string, message_uid: string, newMessageText: string) {
        const message = await this.messageRepository.findOne({
            where: {
                uuid: message_uid
            },
            relations: ['from', 'to']
        })
        if (!message)   throw new HttpException('Room not found', HttpStatus.NOT_FOUND);

        if (message.from.uuid !== userUUID)  throw new HttpException("Message doesn't belong to the user", HttpStatus.FORBIDDEN);

        message.message = newMessageText
        message.wasEdited = true
        
        await this.messageRepository.save(message);

        return {
            roomUUID: message.to.uuid,
            newMessageText: newMessageText
        }
    }
}
