import { AbstractEntity } from 'src/global/entity/abstract.entity';
import { UserEntity } from 'src/modules/user/entities/user.entity';
import { Column, Entity, ManyToMany, ManyToOne, OneToMany } from 'typeorm';
import { MessageEntity } from './message.entity';

@Entity('room')
export class RoomEntity extends AbstractEntity {
    @Column()
    name: string;

    @ManyToOne(() => UserEntity, (user) => user.id)
    owner: UserEntity;

    @ManyToMany(() => UserEntity, (user) => user.chats, {
        cascade: true,
    })
    users: UserEntity[];

    @OneToMany(() => MessageEntity, (message) => message.to)
    messages: MessageEntity[]

    @Column({nullable: true})
    logo_url?: string;
}
