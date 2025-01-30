import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { WSJoinDto } from './dto/join.dto';
import { WSNewMessageDto } from './dto/create-message.dto';
import { AbstractMessage } from './dto/abstarct-message.interface';
import { Events } from './dto/events.enum';
import { ConnectedUserService } from '../connected-user/connected-user.service';
import { AuthService } from '../auth/auth.service';
import { UserDto } from '../user/dto/user.dto';
import { TokenService } from 'src/services/token/token.service';
import { UserService } from '../user/user.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { ConnectedUserEntity } from '../connected-user/entities/connected-user-entity';
import { ConnectedUserI } from '../connected-user/dto/connected-user-interface';
import { RoomEntity } from './entities/room.entity';
import { OnEvent } from '@nestjs/event-emitter';
import { UserEntity } from '../user/entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@WebSocketGateway()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    constructor(
        @InjectRepository(UserEntity)
        private userRepository: Repository<UserEntity>,
        private readonly chatService: ChatService,
        private readonly connectedUserService: ConnectedUserService,
        private readonly tokenService: TokenService,
        private readonly userService: UserService
    ) {}

    async onModuleInit() {
        await this.connectedUserService.deleteAll();
    }

    @WebSocketServer() io: Server;
    private readonly logger = new Logger('CHAT');

    @SubscribeMessage('join-room')
    async joinRoom(@MessageBody() joinDto: WSJoinDto, @ConnectedSocket() client: Socket) {
        this.logger.log(
            `room-joined`
        );
        // // add user to room in database
        // const user = await this.chatService.joinRoom(joinDto);

        // add user to room in socket
        client.join(joinDto.roomUid);

        this.io
            .to(joinDto.roomUid)
            .emit('joined', { newUser: joinDto.userUid });
        this.logger.log(
            `User ${joinDto.userUid} joined room ${joinDto.roomUid}`
        );
        console.log(`Rooms: `, client.rooms);
    }

    @SubscribeMessage('createRoom')
    public async onCreateRoom(@MessageBody() createdRoom: RoomEntity){
        console.log(4)
        for (const user of createdRoom.users) {
            console.log(user)
            const connections: ConnectedUserI[] = await this.connectedUserService.findByUser(user.uuid)
            console.log(connections)
            
            
            const rooms = await this.userService.findChatsByUser(user.uuid)
            for (const connection of connections) {
                console.log(5)
                await this.io.to(connection.socketId).emit('rooms', rooms)
            }
        }
        console.log(6)
    }

    // @SubscribeMessage('message')
    // async sendMessage(@MessageBody() newMessage: WSNewMessageDto) {
    //     // save message to database
    //     const message = await this.chatService.createMessage(newMessage);
    //     console.log('New message => ', message);

    //     // send mesage to room
    //     console.log(`Rooms => `, this.io.sockets.adapter.rooms);
    //     this.io.to(message.toRoomUid).emit('message', message);
    // }

    @SubscribeMessage('file')
    async sendFile(@MessageBody() data: any) {
        console.log(data);
    }

    // @OnEvent('onSuccesfulLogin')
    @SubscribeMessage('onSuccesfulLogin')
    async hanConn(@MessageBody() user: UserEntity, @ConnectedSocket() client: Socket) {
        try {
            this.logger.log("onSuccesfulLogin triggered")
            if (!user) {
                return this.disconnect(client);
            }
            else {
                console.log(client.id)
                this.connectedUserService.create({
                    socketId: client.id,
                    user_uuid: user.uuid
                })
                // user.chats.forEach(chat => {
                //     client.join(chat.uuid)
                // })
                // client.join(user.chats[0].uuid);

            }
        }
        catch (error) {
            this.logger.log(error)
            return this.disconnect(client)
        }
        
    }

    async handleConnection(@ConnectedSocket() client: Socket) {
        this.logger.log(
            `Client ${client.id} connected! Total connections: ${this.io.sockets.sockets.size}!`
        );
            
        
    }

    private disconnect(@ConnectedSocket() socket: Socket) {
        socket.emit('UnauthorizedException', new UnauthorizedException());
        socket.disconnect();
      }

    async handleDisconnect(@ConnectedSocket() client: Socket) {
        const connectedUser = await this.connectedUserService.findBySocketID(client.id)
        this.connectedUserService.deleteBySocketId(client.id)
        this.logger.log(
            `Client ${client.id} disconnected! Total connections: ${this.io.sockets.sockets}!`
        );
        client.disconnect()

        try {
            const user = await this.userRepository.findOne({
                where: {
                    uuid: connectedUser[0].user_uuid
                }
            })
    
            console.log(user) 
    
            user.lastVisit = new Date()
    
            this.userRepository.save(user);

        }
        catch {

        }

    }

    sendMessage(message: AbstractMessage) {
        this.logger.log(`Message => ${message}`)
        const result = this.io.to(message.toRoomUid).emit('message', message);
    }

    chatNameChange(newName: string, roomUUID: string) {
        const result = this.io.to(roomUUID).emit('newChatName', newName);
    }

    chatAvatarChange(newAvatar: string, roomUUID: string) {
        const result = this.io.to(roomUUID).emit('newAvatar', newAvatar);
    }

    chatBackgroundChange(newBackground: string, roomUUID: string) {
        const result = this.io.to(roomUUID).emit('newBackground', newBackground);
    }

    messageDeletion(messagesDeleted: string[], roomUUID: string) {
        console.log(`Messages deleted amount: ${messagesDeleted.length}`)
        const result = this.io.to(roomUUID).emit('messageDeletion', messagesDeleted);
    }

    allMessagesDeleted(roomUUID: string) {
        const result = this.io.to(roomUUID).emit('allMessagesDeleted');
    }

    usersAdded(newUsers: UserEntity[], roomUUID: string) {
        const result = this.io.to(roomUUID).emit('usersAdded', newUsers);
    }

    userDeletion(deletedUser: string, roomUUID: string) {
        const result = this.io.to(roomUUID).emit('userDeletion', deletedUser);
    }
}
