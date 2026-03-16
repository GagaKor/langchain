import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from './health.service';
import { ChromaService } from '../chroma/chroma.service';
import { OllamaService } from '../llm/ollama.service';

describe('HealthService', () => {
  let service: HealthService;
  let chromaService: ChromaService;
  let ollamaService: OllamaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: ChromaService,
          useValue: {
            heartbeat: jest.fn(),
          },
        },
        {
          provide: OllamaService,
          useValue: {
            heartbeat: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
    chromaService = module.get<ChromaService>(ChromaService);
    ollamaService = module.get<OllamaService>(OllamaService);
  });

  it('returns ok when both dependencies are healthy', async () => {
    jest.spyOn(chromaService, 'heartbeat').mockResolvedValue();
    jest.spyOn(ollamaService, 'heartbeat').mockResolvedValue();

    const result = await service.check();

    expect(result).toEqual({
      status: 'ok',
      chroma: 'ok',
      ollama: 'ok',
      timestamp: expect.any(String),
    });
  });

  it('returns degraded when one dependency fails', async () => {
    jest.spyOn(chromaService, 'heartbeat').mockRejectedValue(new Error('down'));
    jest.spyOn(ollamaService, 'heartbeat').mockResolvedValue();

    const result = await service.check();

    expect(result).toEqual({
      status: 'degraded',
      chroma: 'failed',
      ollama: 'ok',
      timestamp: expect.any(String),
    });
  });
});
