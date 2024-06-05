import { AbstractEntity } from 'src/global/entity/abstract.entity';
import { UserEntity } from 'src/modules/user/entities/user.entity';
import { Column, Entity, ManyToMany, ManyToOne } from 'typeorm';

@Entity('room')
export class RoomEntity extends AbstractEntity {
    @Column()
    name: string;

    @ManyToOne(() => UserEntity, (user) => user.id)
    owner: UserEntity;

    @ManyToMany(() => UserEntity, (user) => user.chats)
    users: UserEntity[];
}
