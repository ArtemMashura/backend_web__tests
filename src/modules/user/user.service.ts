import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from '../../global/dto/create-user.dto';
import { UserEntity } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { RoomEntity } from '../chat/entities/room.entity';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(UserEntity)
        private userRepository: Repository<UserEntity>,
        @InjectRepository(RoomEntity)
        private roomRepository: Repository<RoomEntity>
    ) {}

    async create(createUserDto: CreateUserDto) {
        

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
        // const posts = await this.userRepository.createQueryBuilder("user")
        //     .where(qb => {
        //         const subQuery = qb.subQuery()
        //             .select("user.name")
        //             .from(User, "user")
        //             .where("user.registered = :registered")
        //             .getQuery()
        //             .;
        //         return "post.title IN " + subQuery;
        //     })
        //     .setParameter("registered", true)
        //     .getMany();

        // return await this.userRepository.find({
        //     where: { uuid },
        //     relations: ['chats', 'chats.messages'],
            
        // });

        // var rooms = await this.roomRepository.createQueryBuilder('room')
        //     .leftJoinAndSelect('room.messages', 'messages')
        //     .leftJoinAndSelect('room.users', 'users')
        //     .where('users.uuid = :uuid', { uuid: uuid })
        //     .getMany();

        var rooms = await this.roomRepository.find({
            
            relations: {
                messages: true,
                users: true,
                owner: true
            },
            
        });
        return rooms
    }
}
