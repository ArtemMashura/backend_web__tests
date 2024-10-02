import { AbstractEntity } from 'src/global/entity/abstract.entity';
import { UserEntity } from 'src/modules/user/entities/user.entity';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { RoomEntity } from './room.entity';
import { DirectMessageRoomEntity } from 'src/modules/direct-message/entities/direct-message-room.entity';
import { MessageEntity } from './message.entity';

@Entity('file')
export class FileEntity extends AbstractEntity {
    @Column()
    file_url: string;

    @ManyToOne(() => MessageEntity, (message) => message.files_urls, { nullable: true,  })
    message?: MessageEntity

    
}
