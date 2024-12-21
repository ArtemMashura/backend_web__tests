import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from '../../global/dto/create-user.dto';
import { UserEntity } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { RoomEntity } from '../chat/entities/room.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { FilesUploadS3Service } from 'src/services/files-upload-s3/files-upload-s3.service';
import { v4 } from 'uuid';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(UserEntity)
        private userRepository: Repository<UserEntity>,
        @InjectRepository(RoomEntity)
        private roomRepository: Repository<RoomEntity>,
        private readonly filesUploadS3Service: FilesUploadS3Service,
    ) {}

    async create(createUserDto: CreateUserDto) {
        
        const newUser = await this.userRepository.save({
            ...createUserDto,
            password: await bcrypt.hash(createUserDto.password, 10),
            chats: [],
        });
        return newUser
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

        var rooms = await this.roomRepository.createQueryBuilder('room')
            .leftJoinAndSelect('room.messages', 'messages')
            .leftJoinAndSelect('room.users', 'users')
            .leftJoinAndSelect('room.owner', 'owner')
            .where('users.uuid = :uuid', { uuid: uuid })
            .getMany();

        // var rooms = await this.roomRepository.find({
        //     relations: {
        //         messages: true,
        //         users: true,
        //         owner: true,
        //     },  
        //     select: {
        //         messages: true
        //     }
        // });


        return rooms
    }

    async changePassword(updateUser: ChangePasswordDto, userUUID: string){
        if (updateUser.password !== updateUser.confirmPassword){
            throw new BadRequestException('Fields "Password" and "Confirm password" do not match'); 
        }
        const user = await this.userRepository.findOne({
            where: {
                uuid: userUUID
            }
        })

        if (!user)   throw new HttpException('User not found', HttpStatus.NOT_FOUND);

        user.password = await bcrypt.hash(updateUser.password, 10)

        await this.userRepository.save(user);

        return {
            success: true
        }
    }

    async changeName(updateUser: UpdateUserDto, userUUID: string){
        if (!updateUser.nickname){
            throw new BadRequestException('No new nickname provided'); 
        }
        const user = await this.userRepository.findOne({
            where: {
                uuid: userUUID
            }
        })
        if (!user)   throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    
        user.nickname = updateUser.nickname

        await this.userRepository.save(user);

        return {
            newNickname: user.nickname
        }
    }

    async changeProfilePicture(file: Express.Multer.File, userUUID: string){
        if (!file){
            throw new BadRequestException('No new profile picture provided'); 
        }
        const user = await this.userRepository.findOne({
            where: {
                uuid: userUUID
            }
        })
        if (!user)   throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    
        var profile_url = await this.filesUploadS3Service.uploadProfilePhoto(                                       
            `${user.nickname}/${v4()}.${file.mimetype.split('/')[1]}`, // Xepobopa/jasl3-vfk3a-fafo4-opiq3.png
            file.buffer,
            file.mimetype
        );
    
        user.profile_url = profile_url

        await this.userRepository.save(user);

        return {
            new_profile_url: profile_url
        }
    }

    async deleteAccount(userUUID: string){
        const user = await this.userRepository.delete({
            uuid: userUUID
        })

        console.log(user)

        if (user.affected === 0)   throw new HttpException('User not found', HttpStatus.NOT_FOUND);

        return null
    }


}
