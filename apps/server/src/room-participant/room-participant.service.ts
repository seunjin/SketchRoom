import { HttpStatus, Injectable } from '@nestjs/common';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RoomParticipant } from './entity/room-participant.entity';
import { JoinRoomParticipantDto } from './dto/join-room-participant.dto';
import { UpdateRoomParticipantDto } from './dto/update-room-participant.dto';
import { Room } from '../room/entity/room.entity';
import { Guest } from '../guest/entity/guest.entity';
import { verifyPassword } from '../common/util/password.util';
import { AppException } from '../common/exception/app.exception';
import { ERROR_CODE } from '../common/constant/error-code.constant';

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

        if (!room) {
          throw new AppException(
            ERROR_CODE.ROOM_NOT_FOUND,
            HttpStatus.NOT_FOUND,
          );
        }

        // 비밀방일때 비밀번호 검증
        if (!room.isPublic) {
          if (!joinRoomParticipantDto.password) {
            throw new AppException(
              ERROR_CODE.ROOM_PASSWORD_REQUIRED,
              HttpStatus.BAD_REQUEST,
            );
          }

          if (
            !room.passwordHash ||
            !(await verifyPassword(
              joinRoomParticipantDto.password,
              room.passwordHash,
            ))
          ) {
            throw new AppException(
              ERROR_CODE.ROOM_PASSWORD_INVALID,
              HttpStatus.FORBIDDEN,
            );
          }
        }

        const guest = await manager.findOne(Guest, {
          where: { id: guestId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!guest) {
          throw new AppException(
            ERROR_CODE.GUEST_NOT_FOUND,
            HttpStatus.NOT_FOUND,
          );
        }

        const existingParticipant = await manager.findOneBy(RoomParticipant, {
          guestId,
        });

        if (existingParticipant)
          throw new AppException(
            ERROR_CODE.ALREADY_JOINED_ROOM,
            HttpStatus.CONFLICT,
          );

        const participantCount = await manager.countBy(RoomParticipant, {
          roomId,
        });

        if (participantCount >= room.maxParticipants) {
          throw new AppException(ERROR_CODE.ROOM_FULL, HttpStatus.CONFLICT);
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
        throw new AppException(
          ERROR_CODE.ALREADY_JOINED_ROOM,
          HttpStatus.CONFLICT,
        );
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

  async updateMe(
    roomId: string,
    guestId: string,
    updateRoomParticipantDto: UpdateRoomParticipantDto,
  ) {
    const participant = await this.roomParticipantRepository.findOne({
      where: { roomId, guestId },
      relations: {
        guest: true,
      },
    });

    if (!participant) {
      throw new AppException(
        ERROR_CODE.ROOM_PARTICIPANT_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    participant.isReady = updateRoomParticipantDto.isReady;

    return this.roomParticipantRepository.save(participant);
  }

  async leave(roomId: string, guestId: string) {
    return this.dataSource.transaction(async (manager) => {
      const participant = await manager.findOneBy(RoomParticipant, {
        roomId,
        guestId,
      });

      if (!participant) {
        throw new AppException(
          ERROR_CODE.ROOM_PARTICIPANT_NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
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
