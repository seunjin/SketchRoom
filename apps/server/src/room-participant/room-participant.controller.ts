import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Delete,
  Headers,
  Body,
} from '@nestjs/common';
import { RoomParticipantService } from './room-participant.service';
import { JoinRoomParticipantDto } from './dto/join-room-participant.dto';
import { UpdateRoomParticipantDto } from './dto/update-room-participant.dto';
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

  @Patch('me')
  updateMe(
    @Param('roomId') roomId: string,
    @Headers('x-guest-id') guestId: string,
    @Body() updateRoomParticipantDto: UpdateRoomParticipantDto,
  ) {
    return this.roomParticipantService.updateMe(
      roomId,
      guestId,
      updateRoomParticipantDto,
    );
  }

  @Delete('me')
  leave(
    @Param('roomId') roomId: string,
    @Headers('x-guest-id') guestId: string,
  ) {
    return this.roomParticipantService.leave(roomId, guestId);
  }
}
