import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { RoomsModule } from './room/rooms.module';
import { GuestModule } from './guest/guest.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['apps/server/.env', '.env'],
      isGlobal: true,
    }),
    DatabaseModule,
    HealthModule,
    RoomsModule,
    GuestModule,
  ],
})
export class AppModule {}
