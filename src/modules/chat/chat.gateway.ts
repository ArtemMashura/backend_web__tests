import { Logger } from '@nestjs/common';
import {
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UserService } from '../user/user.service';
import { MessageDto, UserDto } from './dto/create-message.dto';

@WebSocketGateway({
    // namespace: 'message',
    cors: {
        origin: '*',
    },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    constructor(private readonly userService: UserService) {}

    @WebSocketServer() server: Server;
    private logger = new Logger('ChatGateway');

    @SubscribeMessage('chat')
    async handleEvent(@MessageBody() payload: MessageDto) {
        this.logger.log(payload);
        this.server.emit('chat', payload); // broadcast
        return payload;
    }

    @SubscribeMessage('join_room')
    async handleJoinRoom(
        @MessageBody() payload: { user: UserDto; roomUid: string }
    ) {
        if (payload.user.socketId) {
            const room = await this.userService.getRoomByUid(payload.roomUid);
            this.logger.log(
                `${payload.user.userName} (${payload.user.userUid}) joined room ${room.name}`
            );
            await this.server
                .in(payload.user.socketId)
                .socketsJoin(payload.roomUid);
            await this.userService.addUserToRoom(payload.roomUid, payload.user);
        }
    }

    handleConnection(client: Socket) {
        const { sockets } = this.server.sockets;
        this.logger.log(
            `Client (${client.id}) connected! Connected users => ${sockets.size}`
        );
    }

    async handleDisconnect(client: Socket) {
        const { sockets } = this.server.sockets;
        await this.userService.removeUserFromAllRooms(client.id);
        this.logger.log(
            `Client (${client.id}) disconnected ! Connected users => ${sockets.size}`
        );
    }
}
