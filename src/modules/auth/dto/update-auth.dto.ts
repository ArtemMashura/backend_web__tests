import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from 'src/global/dto/create-user.dto';

export class UpdateAuthDto extends PartialType(CreateUserDto) {}
