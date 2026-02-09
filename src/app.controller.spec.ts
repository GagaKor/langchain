import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { ChromaService } from './rag/chroma/chroma.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: ChromaService,
          useValue: { heartbeat: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  it('should return health payload', async () => {
    await expect(appController.health()).resolves.toHaveProperty('status', 'ok');
  });
});
