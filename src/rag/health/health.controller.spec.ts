import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService, HealthStatus } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;
  let healthService: HealthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: {
            check: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthService = module.get<HealthService>(HealthService);
  });

  it('returns ok status', async () => {
    const status: HealthStatus = {
      status: 'ok',
      chroma: 'ok',
      ollama: 'ok',
      timestamp: new Date().toISOString(),
    };
    jest.spyOn(healthService, 'check').mockResolvedValue(status);

    await expect(controller.getHealth()).resolves.toEqual(status);
  });

  it('throws when degraded', async () => {
    const status: HealthStatus = {
      status: 'degraded',
      chroma: 'failed',
      ollama: 'ok',
      timestamp: new Date().toISOString(),
    };
    jest.spyOn(healthService, 'check').mockResolvedValue(status);

    await expect(controller.getHealth()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
