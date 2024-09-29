import { UserEntity } from "src/modules/user/entities/user.entity";
import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class ConnectedUserEntity{
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    socketId: string

    @Column()
    user_uuid: string
}