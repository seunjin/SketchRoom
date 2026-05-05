import { Column, Entity } from 'typeorm';
import { BaseTable } from '../../common/entity/base-table.entity';

export enum RoomStatus {
  WAITING = 'WAITING',
  PLAYING = 'PLAYING',
  CLOSED = 'CLOSED',
}

@Entity()
export class Room extends BaseTable {
  @Column()
  title: string;

  @Column({ default: true })
  isPublic: boolean;

  @Column({
    type: 'enum',
    enum: RoomStatus,
    default: RoomStatus.WAITING,
  })
  status: RoomStatus;

  @Column()
  hostGuestId: string;

  @Column()
  hostNickname: string;

  @Column({ default: 4 })
  maxParticipants: number;

  @Column({ type: 'varchar', nullable: true })
  passwordHash: string | null;
}
