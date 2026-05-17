import { Module } from '@nestjs/common';
import { RoomController } from './room.controller';
import { RoomService } from './room.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room } from './entity/room.entity';
import { Guest } from '../guest/entity/guest.entity';
import { RoomParticipant } from '../room-participant/entity/room-participant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Room, Guest, RoomParticipant])],
  controllers: [RoomController],
  providers: [RoomService],
})
export class RoomModule {}
