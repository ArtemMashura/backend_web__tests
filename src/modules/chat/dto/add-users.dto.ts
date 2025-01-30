import { IsArray } from 'class-validator';

export class AddUsersDto {
    @IsArray()
    users: Array<string>;
}
