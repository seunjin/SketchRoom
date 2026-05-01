import { Test, TestingModule } from '@nestjs/testing';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';

describe('RoomsController', () => {
  let controller: RoomsController;
  const roomsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    join: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoomsController],
      providers: [{ provide: RoomsService, useValue: roomsService }],
    }).compile();

    controller = module.get<RoomsController>(RoomsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a room', async () => {
    const room = { id: 'room-id' };
    const dto = { clientId: 'client-id', nickname: 'jin' };
    roomsService.create.mockResolvedValue(room);

    await expect(controller.create(dto)).resolves.toBe(room);
    expect(roomsService.create).toHaveBeenCalledWith(dto);
  });
});
