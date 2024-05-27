import { IsArray, IsString } from 'class-validator';

export class CreateRoomDto {
    @IsString()
    name: string;

    @IsArray()
    // @ValidateNested({ each: true })
    // @Type(() => String)
    users: Array<string>;
}
