import { RoomType } from '../entities/room.entity';

export class CreateRoomDto {
  title?: string;
  type?: RoomType;
  clientId?: string;
  nickname?: string;
}
