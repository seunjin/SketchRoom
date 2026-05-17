import { Module } from '@nestjs/common';
import { RoomParticipantService } from './room-participant.service';
import { RoomParticipantController } from './room-participant.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomParticipant } from './entity/room-participant.entity';
import { Guest } from '../guest/entity/guest.entity';
import { Room } from '../room/entity/room.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RoomParticipant, Room, Guest])],
  controllers: [RoomParticipantController],
  providers: [RoomParticipantService],
})
export class RoomParticipantModule {}
