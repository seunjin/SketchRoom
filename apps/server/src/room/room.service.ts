import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { Room } from './entity/room.entity';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Guest } from '../guest/entity/guest.entity';
import { hashPassword } from '../common/util/password.util';
import { RoomParticipant } from '../room-participant/entity/room-participant.entity';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    private readonly dataSource: DataSource,
  ) {}
  async create(createRoomDto: CreateRoomDto, guestId: string) {
    const isPublic = createRoomDto.isPublic ?? true;

    if (!isPublic && !createRoomDto.password)
      throw new BadRequestException('비공개 방은 비밀번호가 필요합니다.');

    const passwordHash = createRoomDto.password
      ? await hashPassword(createRoomDto.password)
      : null;

    return this.dataSource.transaction(async (manager) => {
      const guest = await manager.findOneBy(Guest, { id: guestId });

      if (!guest) throw new NotFoundException('게스트가 존재하지 않습니다.');

      const room = await manager.save(
        manager.create(Room, {
          title: createRoomDto.title,
          isPublic,
          passwordHash,
          hostGuestId: guest.id,
          hostNickname: guest.nickname,
          maxParticipants: 4,
        }),
      );

      const participant = manager.create(RoomParticipant, {
        roomId: room.id,
        guestId: guest.id,
        isHost: true,
      });

      await manager.save(participant);

      return this.withoutPasswordHash(room);
    });
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

    const nextIsPublic = updateRoomDto.isPublic ?? room.isPublic;

    room.isPublic = nextIsPublic;

    if (nextIsPublic) {
      room.passwordHash = null;

      const saveRoom = await this.roomRepository.save(room);

      return this.withoutPasswordHash(saveRoom);
    }

    if (updateRoomDto.password !== undefined) {
      if (!updateRoomDto.password) {
        throw new BadRequestException('비공개 방은 비밀번호가 필요합니다.');
      }

      room.passwordHash = await hashPassword(updateRoomDto.password);
    }

    if (!room.passwordHash) {
      throw new BadRequestException('비공개 방은 비밀번호가 필요합니다.');
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
