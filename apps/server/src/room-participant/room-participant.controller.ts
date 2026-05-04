import {
  Controller,
  Get,
  Post,
  Param,
  Delete,
  Headers,
  Body,
} from '@nestjs/common';
import { RoomParticipantService } from './room-participant.service';
import { JoinRoomParticipantDto } from './dto/join-room-participant.dto';
@Controller('rooms/:roomId/participants')
export class RoomParticipantController {
  constructor(
    private readonly roomParticipantService: RoomParticipantService,
  ) {}
  @Post()
  join(
    @Param('roomId') roomId: string,
    @Headers('x-guest-id') guestId: string,
    @Body() joinRoomParticipantDto: JoinRoomParticipantDto,
  ) {
    return this.roomParticipantService.join(
      roomId,
      guestId,
      joinRoomParticipantDto,
    );
  }

  @Get()
  findAllByRoom(@Param('roomId') roomId: string) {
    return this.roomParticipantService.findAllByRoom(roomId);
  }

  @Delete('me')
  leave(
    @Param('roomId') roomId: string,
    @Headers('x-guest-id') guestId: string,
  ) {
    return this.roomParticipantService.leave(roomId, guestId);
  }
}
