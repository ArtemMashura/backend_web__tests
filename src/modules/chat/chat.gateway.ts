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

@WebSocketGateway({namespace: 'chat'})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    constructor(
        private readonly chatService: ChatService,
        private readonly connectedUserService: ConnectedUserService,
        private readonly tokenService: TokenService,
        private readonly userService: UserService
    ) {}

    @WebSocketServer() io: Server;
    private readonly logger = new Logger('CHAT');

    @SubscribeMessage('join-room')
    async joinRoom(
        @MessageBody() joinDto: WSJoinDto,
        @ConnectedSocket() client: Socket
    ) {
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

    @OnEvent('createRoom')
    public async onCreateRoom(createdRoom: RoomEntity){
        console.log(4)
        for (const user of createdRoom.users) {
            const connections: ConnectedUserI[] = await this.connectedUserService.findByUser(user)
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

    async handleConnection(@ConnectedSocket() client: Socket) {
        try {
            const decodedToken = await this.tokenService.verifyToken(client.handshake.headers.authorization, 'access');
            const user: UserDto = await this.userService.findOneByUid(decodedToken.user.uuid);
            if (!user) {
                return this.disconnect(client);
            }
            else {
                await this.connectedUserService.create({
                    socketId: client.id,
                    user: user
                })
        
                this.logger.log(
                    `Client ${client.id} connected! Total connections: ${this.io.sockets.sockets.size}!`
                );
            }
        }
        catch {
            return this.disconnect(client)
        }
        
    }

    private disconnect(@ConnectedSocket() socket: Socket) {
        socket.emit('UnauthorizedException', new UnauthorizedException());
        socket.disconnect();
      }

    async handleDisconnect(@ConnectedSocket() client: Socket) {
        await this.connectedUserService.deleteBySocketId(client.id)
        this.logger.log(
            `Client ${client.id} disconnected! Total connections: ${this.io.sockets.sockets.size}!`
        );
        client.disconnect()
    }

    sendMessage(message: AbstractMessage) {
        console.log('Message => ', message);
        this.io.to(message.toRoomUid).emit('message', message);
    }
}
