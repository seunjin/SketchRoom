import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class AppService {
  constructor(private readonly dataSource: DataSource) {}

  getHello(): string {
    return 'Hello World!';
  }

  getHealth(): { status: string } {
    return { status: 'ok' };
  }

  async getDatabaseHealth(): Promise<{ status: string }> {
    await this.dataSource.query('SELECT 1');
    return { status: 'ok' };
  }
}
