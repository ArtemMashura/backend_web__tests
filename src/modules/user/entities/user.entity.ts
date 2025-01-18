import { AbstractEntity } from 'src/global/entity/abstract.entity';
import { Column, Entity, JoinTable, ManyToMany, OneToMany } from 'typeorm';
import { RoomEntity } from 'src/modules/chat/entities/room.entity';
import { DirectMessageRoomEntity } from 'src/modules/direct-message/entities/direct-message-room.entity';
import { OpenAIChatMessageEntity } from 'src/modules/openAIchat/entities/openAI-message.entity';
import { Exclude } from 'class-transformer';

@Entity('user')
export class UserEntity extends AbstractEntity {
    @Column({ unique: true })
    nickname: string;

    @Column({ unique: true })
    password: string;

    @Column({ unique: true })
    email: string;
    
    @Column({ unique: true })
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

    @OneToMany(() => OpenAIChatMessageEntity, (room) => room.chatWith)
    @JoinTable()
    openAIChat: OpenAIChatMessageEntity[];

    @Column({nullable: true})
    @Exclude()
    lastVisit?: Date
}
