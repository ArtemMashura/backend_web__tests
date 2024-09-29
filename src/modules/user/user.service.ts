import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from '../../global/dto/create-user.dto';
import { UserEntity } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(UserEntity)
        private userRepository: Repository<UserEntity>
    ) {}

    async create(createUserDto: CreateUserDto) {
        const isUserExist = await this.userRepository.exists({
            where: [
                { nickname: createUserDto.nickname }, 
                { email: createUserDto.email },
                { phone: createUserDto.phone },
            ],
        });

        if (isUserExist) {
            throw new BadRequestException('User already exist');
        }

        return await this.userRepository.save({
            ...createUserDto,
            password: await bcrypt.hash(createUserDto.password, 10),
            chats: [],
        });
    }
    
    async findAll() {
        return this.userRepository.find();
    }

    async findOneByNickname(nickname: string) {
        try {
            return await this.userRepository.findOneOrFail({
                where: { nickname },
            });
        } catch (e) {
            throw new BadRequestException('User not found');
        }
    }

    async findOneByUid(uuid: string) {
        try {
            return await this.userRepository.findOneOrFail({
                where: { uuid },
            });
        } catch (e) {
            throw new BadRequestException('User not found');
        }
    }

    async findChatsByUser(uuid: string) {
        return await this.userRepository.find({
            where: { uuid },
            relations: ['chats', 'chats.messages'] //, 'chats.users', 'chats.owner'],
        });
    }
}
