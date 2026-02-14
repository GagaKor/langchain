import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async getHealth() {
    const status = await this.healthService.check();
    if (status.status !== 'ok') {
      throw new ServiceUnavailableException({
        message: 'Service unhealthy',
        details: status,
      });
    }
    return status;
  }
}
