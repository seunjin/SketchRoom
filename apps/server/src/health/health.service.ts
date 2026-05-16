import { Injectable } from '@nestjs/common';
import type { HealthResponse } from '@sketch-room/shared';
import { DataSource } from 'typeorm';

@Injectable()
export class HealthService {
  constructor(private readonly dataSource: DataSource) {}

  getHealth(): HealthResponse {
    return { status: 'ok' };
  }

  async getDatabaseHealth(): Promise<HealthResponse> {
    await this.dataSource.query('SELECT 1');
    return { status: 'ok' };
  }
}
