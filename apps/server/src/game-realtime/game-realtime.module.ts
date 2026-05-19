import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomParticipant } from '../room-participant/entity/room-participant.entity';
import { GameRealtimeGateway } from './game-realtime.gateway';
import { GameRealtimeService } from './game-realtime.service';

@Module({
  exports: [GameRealtimeService],
  imports: [TypeOrmModule.forFeature([RoomParticipant])],
  providers: [GameRealtimeGateway, GameRealtimeService],
})
export class GameRealtimeModule {}
