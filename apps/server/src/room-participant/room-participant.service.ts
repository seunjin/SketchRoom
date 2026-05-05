import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RoomParticipant } from './entity/room-participant.entity';
import { JoinRoomParticipantDto } from './dto/join-room-participant.dto';
import { Room } from '../room/entity/room.entity';
import { Guest } from '../guest/entity/guest.entity';
import { verifyPassword } from '../common/util/password.util';

@Injectable()
export class RoomParticipantService {
  constructor(
    @InjectRepository(RoomParticipant)
    private readonly roomParticipantRepository: Repository<RoomParticipant>,
    private readonly dataSource: DataSource,
  ) {}

  async join(
    roomId: string,
    guestId: string,
    joinRoomParticipantDto: JoinRoomParticipantDto,
  ) {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const room = await manager.findOne(Room, {
          where: { id: roomId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!room) throw new NotFoundException('방이 존재하지 않습니다.');

        // 비밀방일때 비밀번호 검증
        if (!room.isPublic) {
          if (!joinRoomParticipantDto.password) {
            throw new BadRequestException('비밀번호가 필요합니다.');
          }

          if (
            !room.passwordHash ||
            !(await verifyPassword(
              joinRoomParticipantDto.password,
              room.passwordHash,
            ))
          ) {
            throw new ForbiddenException('비밀번호가 일치하지 않습니다.');
          }
        }

        const guest = await manager.findOne(Guest, {
          where: { id: guestId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!guest) throw new NotFoundException('게스트가 존재하지 않습니다.');

        const existingParticipant = await manager.findOneBy(RoomParticipant, {
          guestId,
        });

        if (existingParticipant)
          throw new ConflictException('이미 방에 참가 중 입니다.');

        const participantCount = await manager.countBy(RoomParticipant, {
          roomId,
        });

        if (participantCount >= room.maxParticipants) {
          throw new ConflictException('방에 자리가 없습니다.');
        }

        const participant = manager.create(RoomParticipant, {
          roomId,
          guestId,
          isHost: room.hostGuestId === guestId,
        });

        return manager.save(participant);
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('이미 방에 참가 중 입니다.');
      }

      throw error;
    }
  }

  async findAllByRoom(roomId: string) {
    return this.roomParticipantRepository.find({
      where: { roomId },
      relations: {
        guest: true,
      },
      order: {
        createdAt: 'ASC',
      },
    });
  }

  async leave(roomId: string, guestId: string) {
    return this.dataSource.transaction(async (manager) => {
      const participant = await manager.findOneBy(RoomParticipant, {
        roomId,
        guestId,
      });

      if (!participant) {
        throw new NotFoundException('참가자를 찾을 수 없습니다.');
      }

      const wasHost = participant.isHost;

      await manager.remove(participant);

      const remainingParticipants = await manager.find(RoomParticipant, {
        where: { roomId },
        relations: { guest: true },
        order: { createdAt: 'ASC' },
      });

      if (remainingParticipants.length === 0) {
        await manager.delete(Room, { id: roomId });

        return { success: true, deletedRoom: true };
      }

      if (wasHost) {
        const nextHost = remainingParticipants[0];
        nextHost.isHost = true;

        await manager.save(nextHost);

        await manager.update(Room, roomId, {
          hostGuestId: nextHost.guestId,
          hostNickname: nextHost.guest.nickname,
        });
      }

      return { success: true, deletedRoom: false };
    });
  }

  private isUniqueViolation(error: unknown) {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }

    const driverError: unknown = error.driverError;

    return (
      typeof driverError === 'object' &&
      driverError !== null &&
      'code' in driverError &&
      driverError.code === '23505'
    );
  }
}
