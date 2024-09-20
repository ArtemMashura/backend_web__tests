import { IsArray, IsString, IsUUID } from 'class-validator';

export class CreateDirectMessageRoomDto {
    @IsArray()
    users: Array<string>;
}
