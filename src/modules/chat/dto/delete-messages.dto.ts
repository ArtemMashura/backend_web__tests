import { IsArray } from 'class-validator';

export class DeleteMessagesDto {
    @IsArray()
    messagesUUIDArray: Array<string>;
}
