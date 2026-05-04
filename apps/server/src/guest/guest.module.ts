import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Guest } from './entity/guest.entity';
import { GuestService } from './guest.service';
import { GuestController } from './guest.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Guest])],
  controllers: [GuestController],
  providers: [GuestService],
})
export class GuestModule {}
