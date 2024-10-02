import { AbstractEntity } from 'src/global/entity/abstract.entity';
import { UserEntity } from 'src/modules/user/entities/user.entity';
import { Column, Entity, JoinColumn, JoinTable, ManyToOne, OneToMany } from 'typeorm';
import { RoomEntity } from './room.entity';
import { DirectMessageRoomEntity } from 'src/modules/direct-message/entities/direct-message-room.entity';
import { FileEntity } from './file-url.entity';

@Entity('message')
export class MessageEntity extends AbstractEntity {
    @Column()
    message: string;

    @OneToMany(() => FileEntity, (file) => file.message, {nullable: true, eager: true})
    files_urls?: FileEntity[]

    @Column('timestamptz')
    date: Date;

    @ManyToOne(() => UserEntity, (user) => user.id)
    from: UserEntity;

    @ManyToOne(() => RoomEntity, (room) => room.messages, {nullable : true, cascade: true, onDelete: "SET NULL"})
    to?: RoomEntity;

    @ManyToOne(() => DirectMessageRoomEntity, (room) => room.messages, {nullable : true, cascade: true, onDelete: "SET NULL"})
    toDirectMessageRoom?: DirectMessageRoomEntity;
}
