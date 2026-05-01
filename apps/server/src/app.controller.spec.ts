import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  const dataSource = {
    query: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    dataSource.query.mockResolvedValue([{ '?column?': 1 }]);

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService, { provide: DataSource, useValue: dataSource }],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('health', () => {
    it('should return ok status', () => {
      expect(appController.getHealth()).toEqual({ status: 'ok' });
    });
  });

  describe('database health', () => {
    it('should return ok status when database responds', async () => {
      await expect(appController.getDatabaseHealth()).resolves.toEqual({
        status: 'ok',
      });
      expect(dataSource.query).toHaveBeenCalledWith('SELECT 1');
    });
  });
});
