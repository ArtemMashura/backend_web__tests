import { IsString, IsUUID } from 'class-validator';

export class EditMessageDto {
    @IsString()
    newMessageText: string;
}