import { AbstractEntity } from 'src/global/entity/abstract.entity';
import { Column, Entity, JoinTable, ManyToMany } from 'typeorm';
import { RoomEntity } from 'src/modules/chat/entities/room.entity';

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

    @Column()
    profile_url: string;

    @ManyToMany(() => RoomEntity, (room) => room.users)
    @JoinTable()
    chats: RoomEntity[];
}
