import { AbstractEntity } from 'src/global/entity/abstract.entity';
import { Column, Entity, JoinTable, ManyToMany } from 'typeorm';
import { RoomEntity } from 'src/modules/chat/entities/room.entity';
import { DirectMessageRoomEntity } from 'src/modules/direct-message/entities/direct-message-room.entity';

@Entity('user')
export class UserEntity extends AbstractEntity {
    @Column({ unique: true })
    nickname: string;

    @Column()
    password: string;

    @Column()
    email: string;
    
    @Column()
    phone: string;

    @Column({ nullable: true })
    profile_url?: string;

    @ManyToMany(() => RoomEntity, (room) => room.users)
    @JoinTable()
    chats: RoomEntity[];

    @ManyToMany(() => DirectMessageRoomEntity, (direct_message_room) => direct_message_room.users)
    @JoinTable()
    directMessageRooms: DirectMessageRoomEntity[];

    @Column({ nullable: true })
    hashedRt?: string;
}
