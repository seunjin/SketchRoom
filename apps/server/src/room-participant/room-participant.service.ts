import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
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
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    @InjectRepository(Guest)
    private readonly guestRepository: Repository<Guest>,
  ) {}
  async join(
    roomId: string,
    guestId: string,
    joinRoomParticipantDto: JoinRoomParticipantDto,
  ) {
    const room = await this.roomRepository.findOneBy({ id: roomId });
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

    const guest = await this.guestRepository.findOneBy({ id: guestId });
    if (!guest) throw new NotFoundException('게스트가 존재하지 않습니다.');

    const existingParticipant = await this.roomParticipantRepository.findOneBy({
      guestId,
    });

    if (existingParticipant)
      throw new ConflictException('이미 방에 참가 중 입니다.');

    const participantCount = await this.roomParticipantRepository.countBy({
      roomId,
    });

    if (participantCount >= room.maxParticipants) {
      throw new ConflictException('방에 자리가 없습니다.');
    }

    const participant = this.roomParticipantRepository.create({
      roomId,
      guestId,
      isHost: room.hostGuestId === guestId,
    });

    return this.roomParticipantRepository.save(participant);
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
    const participant = await this.roomParticipantRepository.findOneBy({
      roomId,
      guestId,
    });

    if (!participant) {
      throw new NotFoundException('참가자를 찾을 수 없습니다.');
    }

    await this.roomParticipantRepository.remove(participant);
    return { success: true };
  }
}
