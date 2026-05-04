import { Column, OneToOne, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseTable } from '../../common/entity/base-table.entity';
import { Guest } from '../../guest/entity/guest.entity';
import { Room } from '../../room/entity/room.entity';
//현재 방 참가 상태 row
@Entity()
export class RoomParticipant extends BaseTable {
  @Column()
  roomId: string;

  @ManyToOne(() => Room, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roomId' })
  room: Room;

  @Column({ unique: true })
  guestId: string;

  @OneToOne(() => Guest, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'guestId' })
  guest: Guest;

  @Column({ default: false })
  isHost: boolean; //이 참가자가 방장인지 표시
}
