import { AbstractEntity } from 'src/global/entity/abstract.entity';
import { UserEntity } from 'src/modules/user/entities/user.entity';
import { Column, Entity, ManyToOne, } from 'typeorm';

@Entity('openAIChatMessage')
export class OpenAIChatMessageEntity extends AbstractEntity {
    @Column()
    role: string;

    @Column()
    content: string;

    @Column('timestamptz')
    date: Date;

    // @Column()
    // name: string;

    @ManyToOne(() => UserEntity, (user) => user.id)
    chatWith: UserEntity;
}
