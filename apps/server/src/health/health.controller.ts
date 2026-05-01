import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  getHealth(): { status: string } {
    return this.healthService.getHealth();
  }

  @Get('db')
  getDatabaseHealth(): Promise<{ status: string }> {
    return this.healthService.getDatabaseHealth();
  }
}
