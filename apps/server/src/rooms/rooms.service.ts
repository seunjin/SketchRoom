import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { CloseRoomDto } from './dto/close-room.dto';
import { CreateRoomDto } from './dto/create-room.dto';
import { JoinRoomDto } from './dto/join-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import {
  RoomParticipant,
  RoomParticipantRole,
} from './entities/room-participant.entity';
import { Room, RoomStatus, RoomType } from './entities/room.entity';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    @InjectRepository(RoomParticipant)
    private readonly participantRepository: Repository<RoomParticipant>,
  ) {}

  async create(createRoomDto: CreateRoomDto): Promise<Room> {
    const clientId = this.requireText(createRoomDto.clientId, 'clientId', 80);
    const nickname = this.requireText(createRoomDto.nickname, 'nickname', 30);
    const title =
      this.normalizeText(createRoomDto.title, 80) ?? `${nickname}'s room`;
    const type = this.normalizeRoomType(createRoomDto.type);

    const room = await this.roomRepository.save(
      this.roomRepository.create({
        title,
        type,
        status: RoomStatus.WAITING,
      }),
    );

    await this.participantRepository.save(
      this.participantRepository.create({
        roomId: room.id,
        clientId,
        nickname,
        role: RoomParticipantRole.HOST,
      }),
    );

    return this.findOne(room.id);
  }

  findAll(): Promise<Room[]> {
    return this.roomRepository.find({
      where: { status: Not(RoomStatus.CLOSED) },
      relations: { participants: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Room> {
    return this.findRoomOrFail(id);
  }

  async update(id: string, updateRoomDto: UpdateRoomDto): Promise<Room> {
    const clientId = this.requireText(updateRoomDto.clientId, 'clientId', 80);
    const title = this.requireText(updateRoomDto.title, 'title', 80);
    const room = await this.findRoomOrFail(id);

    await this.assertHost(room.id, clientId);

    room.title = title;
    await this.roomRepository.save(room);

    return this.findOne(room.id);
  }

  async join(id: string, joinRoomDto: JoinRoomDto): Promise<RoomParticipant> {
    const clientId = this.requireText(joinRoomDto.clientId, 'clientId', 80);
    const nickname = this.requireText(joinRoomDto.nickname, 'nickname', 30);
    const room = await this.findRoomOrFail(id);

    if (room.status === RoomStatus.CLOSED) {
      throw new BadRequestException('Closed room cannot be joined.');
    }

    const activeParticipant = await this.participantRepository.findOne({
      where: { roomId: room.id, clientId, leftAt: IsNull() },
    });

    if (activeParticipant) {
      activeParticipant.nickname = nickname;
      return this.participantRepository.save(activeParticipant);
    }

    return this.participantRepository.save(
      this.participantRepository.create({
        roomId: room.id,
        clientId,
        nickname,
        role: RoomParticipantRole.MEMBER,
      }),
    );
  }

  async remove(id: string, closeRoomDto: CloseRoomDto): Promise<Room> {
    const clientId = this.requireText(closeRoomDto.clientId, 'clientId', 80);
    const room = await this.findRoomOrFail(id);

    await this.assertHost(room.id, clientId);

    room.status = RoomStatus.CLOSED;
    room.closedAt = new Date();
    await this.roomRepository.save(room);

    return this.findOne(room.id);
  }

  private async findRoomOrFail(id: string): Promise<Room> {
    const room = await this.roomRepository.findOne({
      where: { id },
      relations: { participants: true },
    });

    if (!room) {
      throw new NotFoundException('Room not found.');
    }

    return room;
  }

  private async assertHost(roomId: string, clientId: string): Promise<void> {
    const host = await this.participantRepository.findOne({
      where: {
        roomId,
        clientId,
        role: RoomParticipantRole.HOST,
        leftAt: IsNull(),
      },
    });

    if (!host) {
      throw new ForbiddenException('Only room host can perform this action.');
    }
  }

  private normalizeRoomType(type?: RoomType): RoomType {
    if (!type) {
      return RoomType.GROUP;
    }

    if (!Object.values(RoomType).includes(type)) {
      throw new BadRequestException('Invalid room type.');
    }

    return type;
  }

  private requireText(
    value: string | undefined,
    fieldName: string,
    maxLength: number,
  ): string {
    const normalized = this.normalizeText(value, maxLength);

    if (!normalized) {
      throw new BadRequestException(`${fieldName} is required.`);
    }

    return normalized;
  }

  private normalizeText(
    value: string | undefined,
    maxLength: number,
  ): string | undefined {
    const normalized = value?.trim();

    if (!normalized) {
      return undefined;
    }

    if (normalized.length > maxLength) {
      throw new BadRequestException(
        `Text must be ${maxLength} characters or less.`,
      );
    }

    return normalized;
  }
}
