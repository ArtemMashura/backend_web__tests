import { IsString, IsUUID } from 'class-validator';

export class MessageDto {
    @IsString()
    message: string;

    @IsUUID()
    messageUid: string;
}

export class UserDto {
    @IsString()
    userName: string;

    @IsUUID()
    userUid: string;

    @IsString()
    socketId: string;
}
