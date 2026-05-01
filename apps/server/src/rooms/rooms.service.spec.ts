import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RoomParticipantRole } from './entities/room-participant.entity';
import { RoomStatus, RoomType } from './entities/room.entity';
import { RoomParticipant } from './entities/room-participant.entity';
import { Room } from './entities/room.entity';
import { RoomsService } from './rooms.service';

describe('RoomsService', () => {
  let service: RoomsService;
  const roomRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };
  const participantRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomsService,
        { provide: getRepositoryToken(Room), useValue: roomRepository },
        {
          provide: getRepositoryToken(RoomParticipant),
          useValue: participantRepository,
        },
      ],
    }).compile();

    service = module.get<RoomsService>(RoomsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a room with host participant', async () => {
    const room = {
      id: 'room-id',
      title: "jin's room",
      type: RoomType.GROUP,
      status: RoomStatus.WAITING,
    };
    const participant = {
      id: 'participant-id',
      roomId: room.id,
      clientId: 'client-id',
      nickname: 'jin',
      role: RoomParticipantRole.HOST,
    };

    roomRepository.create.mockReturnValue(room);
    roomRepository.save.mockResolvedValue(room);
    roomRepository.findOne.mockResolvedValue({
      ...room,
      participants: [participant],
    });
    participantRepository.create.mockReturnValue(participant);
    participantRepository.save.mockResolvedValue(participant);

    await expect(
      service.create({ clientId: 'client-id', nickname: 'jin' }),
    ).resolves.toEqual({ ...room, participants: [participant] });

    expect(participantRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        roomId: room.id,
        clientId: 'client-id',
        nickname: 'jin',
        role: RoomParticipantRole.HOST,
      }),
    );
  });
});
