import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { RoomModule } from './room/room.module';
import { GuestModule } from './guest/guest.module';
import { RoomParticipantModule } from './room-participant/room-participant.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['apps/server/.env', '.env'],
      isGlobal: true,
    }),
    DatabaseModule,
    HealthModule,
    RoomModule,
    GuestModule,
    RoomParticipantModule,
  ],
})
export class AppModule {}
