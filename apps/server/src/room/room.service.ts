import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { Room, RoomStatus } from './entity/room.entity';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Guest } from '../guest/entity/guest.entity';
import { hashPassword } from '../common/util/password.util';
import { RoomParticipant } from '../room-participant/entity/room-participant.entity';
import { AppException } from '../common/exception/app.exception';
import { ERROR_CODE } from '../common/constant/error-code.constant';
import { GameRealtimeService } from '../game-realtime/game-realtime.service';
import type { Room as SharedRoom } from '@sketch-room/shared';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    private readonly dataSource: DataSource,
    private readonly gameRealtimeService: GameRealtimeService,
  ) {}
  async create(createRoomDto: CreateRoomDto, guestId: string) {
    const isPublic = createRoomDto.isPublic ?? true;

    if (!isPublic && !createRoomDto.password)
      throw new AppException(
        ERROR_CODE.ROOM_PASSWORD_REQUIRED,
        HttpStatus.BAD_REQUEST,
      );

    const passwordHash = createRoomDto.password
      ? await hashPassword(createRoomDto.password)
      : null;

    return this.dataSource.transaction(async (manager) => {
      const guest = await manager.findOneBy(Guest, { id: guestId });

      if (!guest) {
        throw new AppException(
          ERROR_CODE.GUEST_NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }

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
      throw new AppException(ERROR_CODE.ROOM_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    return this.withoutPasswordHash(room);
  }
  //업데이트
  async update(id: string, updateRoomDto: UpdateRoomDto, guestId: string) {
    const room = await this.roomRepository.findOneBy({ id });

    if (!room) {
      throw new AppException(ERROR_CODE.ROOM_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    if (room.hostGuestId !== guestId) {
      throw new AppException(ERROR_CODE.ROOM_HOST_ONLY, HttpStatus.FORBIDDEN);
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
        throw new AppException(
          ERROR_CODE.ROOM_PASSWORD_REQUIRED,
          HttpStatus.BAD_REQUEST,
        );
      }

      room.passwordHash = await hashPassword(updateRoomDto.password);
    }

    if (!room.passwordHash) {
      throw new AppException(
        ERROR_CODE.ROOM_PASSWORD_REQUIRED,
        HttpStatus.BAD_REQUEST,
      );
    }

    const saveRoom = await this.roomRepository.save(room);

    return this.withoutPasswordHash(saveRoom);
  }

  async start(id: string, guestId: string) {
    const startedRoom = await this.dataSource.transaction(async (manager) => {
      const room = await manager.findOne(Room, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!room) {
        throw new AppException(ERROR_CODE.ROOM_NOT_FOUND, HttpStatus.NOT_FOUND);
      }

      if (room.hostGuestId !== guestId) {
        throw new AppException(ERROR_CODE.ROOM_HOST_ONLY, HttpStatus.FORBIDDEN);
      }

      if (room.status !== RoomStatus.WAITING) {
        throw new AppException(
          ERROR_CODE.ROOM_NOT_WAITING,
          HttpStatus.CONFLICT,
        );
      }

      const participants = await manager.find(RoomParticipant, {
        where: { roomId: id },
        order: { createdAt: 'ASC' },
      });

      if (participants.length < 2) {
        throw new AppException(
          ERROR_CODE.ROOM_MIN_PARTICIPANTS,
          HttpStatus.CONFLICT,
        );
      }

      const hasUnreadyParticipant = participants.some(
        (participant) =>
          participant.guestId !== room.hostGuestId && !participant.isReady,
      );

      if (hasUnreadyParticipant) {
        throw new AppException(
          ERROR_CODE.ROOM_PARTICIPANTS_NOT_READY,
          HttpStatus.CONFLICT,
        );
      }

      room.status = RoomStatus.PLAYING;

      const savedRoom = await manager.save(room);

      return this.withoutPasswordHash(savedRoom);
    });

    this.gameRealtimeService.broadcastGameStarted(
      id,
      guestId,
      this.toSharedRoom(startedRoom),
    );

    return startedRoom;
  }

  private toSharedRoom(room: Omit<Room, 'passwordHash'>): SharedRoom {
    return {
      ...room,
      createdAt: room.createdAt.toISOString(),
      updatedAt: room.updatedAt.toISOString(),
    };
  }

  private withoutPasswordHash(room: Room) {
    const { passwordHash, ...roomWithoutPasswordHash } = room;

    void passwordHash;

    return roomWithoutPasswordHash;
  }
}
