import { BadRequestException, Controller, Get, Param } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Get('/rooms')
    async findAll() {
        return this.userService.getRooms();
    }

    @Get('/room/:roomUid')
    async getRoomByUid(@Param('roomUid') roomUid: string) {
        const room = this.userService.getRoomByUid(roomUid);
        if (!room) throw new BadRequestException('Room not found');

        return room;
    }
}
