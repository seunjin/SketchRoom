import { Injectable } from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

@Injectable()
export class RoomService {
  //생성
  create(createRoomDto: CreateRoomDto, guestId: string) {
    void createRoomDto;
    void guestId;
    return 'This action adds a new room';
  }

  //전체 조회
  findAll() {
    return `This action returns all room`;
  }
  //단일 조회
  findOne(id: number) {
    return `This action returns a #${id} room`;
  }
  //업데이트
  update(id: number, updateRoomDto: UpdateRoomDto) {
    void updateRoomDto;
    return `This action updates a #${id} room`;
  }
  //삭제
  remove(id: number) {
    return `This action removes a #${id} room`;
  }
}
