import { IsBoolean } from 'class-validator';

export class UpdateRoomParticipantDto {
  @IsBoolean()
  isReady: boolean;
}
