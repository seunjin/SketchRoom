import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Room } from './room.entity';

export enum RoomParticipantRole {
  HOST = 'host',
  MEMBER = 'member',
}

@Entity('room_participants')
export class RoomParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'room_id', type: 'uuid' })
  roomId: string;

  @ManyToOne(() => Room, (room) => room.participants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @Column({ name: 'client_id', type: 'varchar', length: 80 })
  clientId: string;

  @Column({ type: 'varchar', length: 30 })
  nickname: string;

  @Column({
    type: 'enum',
    enum: RoomParticipantRole,
    default: RoomParticipantRole.MEMBER,
  })
  role: RoomParticipantRole;

  @Column({ type: 'integer', default: 0 })
  score: number;

  @CreateDateColumn({ name: 'joined_at', type: 'timestamptz' })
  joinedAt: Date;

  @Column({ name: 'left_at', type: 'timestamptz', nullable: true })
  leftAt: Date | null;
}
