import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { RoomsModule } from './rooms/rooms.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['apps/server/.env', '.env'],
      isGlobal: true,
    }),
    DatabaseModule,
    HealthModule,
    RoomsModule,
  ],
})
export class AppModule {}
