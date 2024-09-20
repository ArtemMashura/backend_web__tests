import { AbstractEntity } from 'src/global/entity/abstract.entity';
import { UserEntity } from 'src/modules/user/entities/user.entity';
import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, Unique } from 'typeorm';
import { MessageEntity } from '../../chat/entities/message.entity';

@Entity('direct_message_room')
export class DirectMessageRoomEntity extends AbstractEntity {
    @ManyToMany(() => UserEntity, (user) => user.directMessageRooms,  {
        cascade: true,
    }, )
    users: UserEntity[];
    
    @OneToMany(() => MessageEntity, (message) => message.toDirectMessageRoom)
    messages: MessageEntity[]
}
