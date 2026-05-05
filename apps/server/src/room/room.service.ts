import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { Room } from './entity/room.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Guest } from '../guest/entity/guest.entity';
import { hashPassword } from '../common/util/password.util';
import { RoomParticipant } from '../room-participant/entity/room-participant.entity';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    @InjectRepository(Guest)
    private readonly guestRepository: Repository<Guest>,
    @InjectRepository(RoomParticipant)
    private readonly roomParticipantRepository: Repository<RoomParticipant>,
  ) {}
  async create(createRoomDto: CreateRoomDto, guestId: string) {
    const guest = await this.guestRepository.findOneBy({ id: guestId });

    if (!guest) throw new NotFoundException('게스트가 존재하지 않습니다.');

    const isPublic = createRoomDto.isPublic ?? true;

    if (!isPublic && !createRoomDto.password)
      throw new BadRequestException('비공개 방은 비밀번호가 필요합니다.');

    const room = this.roomRepository.create({
      title: createRoomDto.title,
      isPublic,
      passwordHash: createRoomDto.password
        ? await hashPassword(createRoomDto.password)
        : null,
      hostGuestId: guest.id,
      hostNickname: guest.nickname,
      maxParticipants: 4,
    });

    const participant = this.roomParticipantRepository.create({
      roomId: room.id,
      guestId: guest.id,
      isHost: true,
    });

    await this.roomParticipantRepository.save(participant);

    return room;
  }

  //전체 조회
  async findAll() {
    const rooms = await this.roomRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });

    return rooms.map((room) => this.withoutPasswordHash(room));
  }
  //단일 조회
  async findOne(id: string) {
    const room = await this.roomRepository.findOneBy({ id });

    if (!room) {
      throw new NotFoundException('방이 존재하지 않습니다.');
    }

    return this.withoutPasswordHash(room);
  }
  //업데이트
  async update(id: string, updateRoomDto: UpdateRoomDto, guestId: string) {
    const room = await this.roomRepository.findOneBy({ id });

    if (!room) {
      throw new NotFoundException('방이 존재하지 않습니다.');
    }

    if (room.hostGuestId !== guestId) {
      throw new ForbiddenException('방장만 수정할 수 있습니다.');
    }

    if (updateRoomDto.title !== undefined) {
      room.title = updateRoomDto.title;
    }

    if (updateRoomDto.isPublic) {
      room.passwordHash = null;
    }

    if (!room.isPublic) {
      if (updateRoomDto.password !== undefined) {
        room.passwordHash = await hashPassword(updateRoomDto.password);
      }

      if (!room.passwordHash) {
        throw new BadRequestException('비공개 방은 비밀번호가 필요합니다.');
      }
    }

    const saveRoom = await this.roomRepository.save(room);

    return this.withoutPasswordHash(saveRoom);
  }

  private withoutPasswordHash(room: Room) {
    const { passwordHash, ...roomWithoutPasswordHash } = room;

    void passwordHash;

    return roomWithoutPasswordHash;
  }
}
