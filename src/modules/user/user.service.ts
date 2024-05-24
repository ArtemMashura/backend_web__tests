import { BadRequestException, Injectable } from '@nestjs/common';
import { Room, User } from 'src/interface/chat.interface';

@Injectable()
export class UserService {
    private rooms: Room[] = [];

    public async getRooms() {
        return this.rooms;
    }

    public async addRoom(roomName: string, user: User) {
        const room = await this.getRoomIndexByName(roomName);
        if (room !== -1) {
            this.rooms.push({
                name: roomName,
                host: user,
                users: [user],
                roomUid: crypto.randomUUID(),
            });
        }
    }

    public async getRoomByUid(roomUid: string) {
        return this.rooms.find((room) => room.roomUid === roomUid);
    }

    public async removeRoom(roomUid: string) {
        const room = await this.getRoomIndexByName(roomUid);

        if (room !== -1) {
            throw new BadRequestException(
                `Can't find room with UUID: ${roomUid}`
            );
        }

        this.rooms = this.rooms.filter((room) => room.roomUid !== roomUid);
    }

    public async getHostByRoomUid(roomUid: string) {
        const roomIndex = await this.getRoomIndexByUid(roomUid);
        if (roomIndex === -1) {
            throw new BadRequestException(
                `Can't find room with UUID: ${roomUid}`
            );
        }

        return this.rooms[roomIndex].host;
    }

    public async addUserToRoom(roomUid: string, user: User) {
        const roomIndex = await this.getRoomIndexByUid(roomUid);
        if (roomIndex === -1) {
            throw new BadRequestException(
                `Can't find room with UUID: ${roomUid}`
            );
        }

        this.rooms[roomIndex].users.push(user);
        const host = await this.getHostByRoomUid(roomUid);
        if (host.userUid === user.userUid) {
            this.rooms[roomIndex].host.socketId = user.socketId;
        }
    }

    public async findRoomsByUserSocketId(socketId: string) {
        const filteredRooms = this.rooms.filter((room) => {
            const user = room.users.find((user) => user.socketId === socketId);
            if (user) return user;
        });

        return filteredRooms;
    }

    public async removeUserFromRoom(roomUid: string, socketId: string) {
        const room = await this.getRoomIndexByUid(roomUid);
        if (room === -1) {
            throw new BadRequestException(
                `Can't find room with UUID: ${roomUid}`
            );
        }

        this.rooms[room].users = this.rooms[room].users.filter(
            (user) => user.socketId !== socketId
        );

        if (this.rooms[room].users.length === 0) {
            this.removeRoom(roomUid);
        }
    }

    public async removeUserFromAllRooms(socketId: string) {
        const rooms = await this.findRoomsByUserSocketId(socketId);

        rooms.forEach((room) => {
            this.removeUserFromRoom(room.roomUid, socketId);
        });
    }

    public async getRoomIndexByName(roomName: string) {
        return this.rooms.findIndex((room) => room.name === roomName);
    }

    public async getRoomIndexByUid(roomUid: string) {
        return this.rooms.findIndex((room) => room.roomUid === roomUid);
    }
}
