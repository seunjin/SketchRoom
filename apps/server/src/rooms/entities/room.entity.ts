import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RoomParticipant } from './room-participant.entity';

export enum RoomType {
  DIRECT = 'direct',
  GROUP = 'group',
  CATCHMIND = 'catchmind',
}

export enum RoomStatus {
  WAITING = 'waiting',
  PLAYING = 'playing',
  CLOSED = 'closed',
}

@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 80 })
  title: string;

  @Column({ type: 'enum', enum: RoomType, default: RoomType.GROUP })
  type: RoomType;

  @Column({ type: 'enum', enum: RoomStatus, default: RoomStatus.WAITING })
  status: RoomStatus;

  @OneToMany(() => RoomParticipant, (participant) => participant.room)
  participants: RoomParticipant[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
  closedAt: Date | null;
}
