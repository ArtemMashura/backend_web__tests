import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ConnectedUserEntity } from "./entities/connected-user-entity";
import { Repository } from "typeorm";
import { ConnectedUserI } from "./dto/connected-user-interface";
import { UserDto } from "../user/dto/user.dto";

@Injectable()
export class ConnectedUserService {
    constructor(
        @InjectRepository(ConnectedUserEntity)
        private readonly connectedUserRepository: Repository<ConnectedUserEntity>
    ) {}

    async create(connectedUser: ConnectedUserI): Promise<ConnectedUserI> {
        return this.connectedUserRepository.save(connectedUser)
    }

    async findByUser(user: UserDto): Promise<ConnectedUserI[]> {
        return this.connectedUserRepository.find({
            where: {
                user: user
            }
        });
    }

    async deleteBySocketId(socketId: string) {
    return this.connectedUserRepository.delete({ socketId });
    }

    async deleteAll() {
    await this.connectedUserRepository
        .createQueryBuilder()
        .delete()
        .execute();
    }
}