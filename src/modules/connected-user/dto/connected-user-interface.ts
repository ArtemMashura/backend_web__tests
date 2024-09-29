import { UserDto } from "src/modules/user/dto/user.dto";

export interface ConnectedUserI {
    id?: number,
    socketId: string;
    user_uuid: string
}