import { IsDate, IsNumber, IsOptional, IsString } from 'class-validator';

export class AbstractDto {
    @IsNumber()
    @IsOptional()
    public id: number;

    @IsString()
    @IsOptional()
    public uuid: string;

    @IsDate()
    @IsOptional()
    public createdAt: Date;

    @IsDate()
    @IsOptional()
    public updatedAt: Date;
}
