import { IsString, IsUUID } from 'class-validator';

export class WSNewMessageDto {
    @IsString()
    message: string;

    @IsUUID()
    fromUid: string;

    @IsUUID()
    toRoomUid: string;
}
