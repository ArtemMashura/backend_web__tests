import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { Logger } from '@nestjs/common';

@WebSocketGateway()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    constructor(private readonly chatService: ChatService) {}

    @WebSocketServer() io: Server;
    private readonly logger = new Logger('CHAT');

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
}
