import { Controller, Get } from '@nestjs/common';
import type { HealthResponse } from '@sketch-room/shared';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  getHealth(): HealthResponse {
    return this.healthService.getHealth();
  }

  @Get('db')
  getDatabaseHealth(): Promise<HealthResponse> {
    return this.healthService.getDatabaseHealth();
  }
}
