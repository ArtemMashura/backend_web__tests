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
import { Logger } from '@nestjs/common';
import { WSJoinDto } from './dto/join.dto';
import { WSNewMessageDto } from './dto/create-message.dto';
import { AbstractMessage } from './dto/abstarct-message.interface';
import { Events } from './dto/events.enum';

@WebSocketGateway()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    constructor(private readonly chatService: ChatService) {}

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

    handleConnection(client: Socket) {
        this.logger.log(
            `Client ${client.id} connected! Total connections: ${this.io.sockets.sockets.size}!`
        );
    }

    handleDisconnect(client: Socket) {
        this.logger.log(
            `Client ${client.id} disconnected! Total connections: ${this.io.sockets.sockets.size}!`
        );
    }

    sendMessage(message: AbstractMessage) {
        console.log('Message => ', message);
        this.io.to(message.toRoomUid).emit('message', message);
    }
}
