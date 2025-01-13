import { IsString } from 'class-validator';

export class ChangeRoomNameDto {
    @IsString()
    newName: string;
}
