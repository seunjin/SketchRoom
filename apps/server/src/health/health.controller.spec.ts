import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let healthController: HealthController;
  const dataSource = {
    query: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    dataSource.query.mockResolvedValue([{ '?column?': 1 }]);

    const app: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [HealthService, { provide: DataSource, useValue: dataSource }],
    }).compile();

    healthController = app.get<HealthController>(HealthController);
  });

  describe('health', () => {
    it('should return ok status', () => {
      expect(healthController.getHealth()).toEqual({ status: 'ok' });
    });
  });

  describe('database health', () => {
    it('should return ok status when database responds', async () => {
      await expect(healthController.getDatabaseHealth()).resolves.toEqual({
        status: 'ok',
      });
      expect(dataSource.query).toHaveBeenCalledWith('SELECT 1');
    });
  });
});
