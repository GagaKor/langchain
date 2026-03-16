import { ArgumentsHost, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './../src/app.module';
import { HttpExceptionFilter } from './../src/common/filters/http-exception.filter';
import { ChromaService } from './../src/rag/chroma/chroma.service';
import { HealthController } from './../src/rag/health/health.controller';
import { HealthService } from './../src/rag/health/health.service';
import { IngestController } from './../src/rag/ingest/ingest.controller';
import { IngestTextDto } from './../src/rag/ingest/dto/ingest-text.dto';
import { IngestService } from './../src/rag/ingest/services/ingest.service';
import { QueryDto } from './../src/rag/query/dto/query.dto';
import { ServiceUnavailableException } from '@nestjs/common';

describe('App integration', () => {
  let app: INestApplication;
  let healthController: HealthController;
  let ingestController: IngestController;

  const healthServiceMock = {
    check: jest.fn(),
  };
  const ingestServiceMock = {
    ingestText: jest.fn(),
    ingestFile: jest.fn(),
  };
  const chromaServiceMock = {
    getCollectionName: jest.fn().mockReturnValue('test_collection'),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(HealthService)
      .useValue(healthServiceMock)
      .overrideProvider(IngestService)
      .useValue(ingestServiceMock)
      .overrideProvider(ChromaService)
      .useValue(chromaServiceMock)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    healthController = moduleFixture.get<HealthController>(HealthController);
    ingestController = moduleFixture.get<IngestController>(IngestController);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await app.close();
  });

  it('resolves health status from the app module graph', async () => {
    healthServiceMock.check.mockResolvedValue({
      status: 'ok',
      chroma: 'ok',
      ollama: 'ok',
      timestamp: '2025-03-16T00:00:00.000Z',
    });

    await expect(healthController.getHealth()).resolves.toEqual({
      status: 'ok',
      chroma: 'ok',
      ollama: 'ok',
      timestamp: '2025-03-16T00:00:00.000Z',
    });
  });

  it('returns collection metadata for ingest text requests', async () => {
    ingestServiceMock.ingestText.mockResolvedValue(2);

    await expect(
      ingestController.ingestText({
        text: 'MVP planning note',
        metadata: { project: 'mvp' },
      }),
    ).resolves.toEqual({
      ingested: 2,
      collection: 'test_collection',
    });
  });

  it('applies the same query validation rules as bootstrap', async () => {
    const pipe = new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      forbidNonWhitelisted: true,
    });

    await expect(
      pipe.transform(
        { question: '질문', topK: 21, extra: true },
        {
          type: 'body',
          metatype: QueryDto,
          data: '',
        },
      ),
    ).rejects.toMatchObject({
      response: {
        message: expect.arrayContaining([
          'property extra should not exist',
          'topK must not be greater than 20',
        ]),
      },
      status: 400,
    });
  });

  it('formats validation exceptions with the global filter contract', async () => {
    const pipe = new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      forbidNonWhitelisted: true,
    });
    const filter = new HttpExceptionFilter();
    const status = jest.fn().mockReturnThis();
    const json = jest.fn();

    const exception = await pipe
      .transform(
        { metadata: 'invalid' },
        {
          type: 'body',
          metatype: IngestTextDto,
          data: '',
        },
      )
      .catch((error: unknown) => error);

    filter.catch(
      exception,
      {
        switchToHttp: () => ({
          getResponse: () => ({ status, json }),
          getRequest: () => ({ url: '/ingest/text' }),
        }),
      } as ArgumentsHost,
    );

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 400,
        message: 'Validation failed',
        details: expect.objectContaining({
          path: '/ingest/text',
          timestamp: expect.any(String),
          errors: expect.arrayContaining(['metadata must be an object']),
          error: 'Bad Request',
        }),
      }),
    );
  });

  it('formats service unavailable exceptions with the correct status label', () => {
    const filter = new HttpExceptionFilter();
    const status = jest.fn().mockReturnThis();
    const json = jest.fn();

    filter.catch(
      new ServiceUnavailableException({
        message: 'Service unhealthy',
        details: {
          status: 'degraded',
        },
      }),
      {
        switchToHttp: () => ({
          getResponse: () => ({ status, json }),
          getRequest: () => ({ url: '/health' }),
        }),
      } as ArgumentsHost,
    );

    expect(status).toHaveBeenCalledWith(503);
    expect(json).toHaveBeenCalledWith({
      code: 503,
      message: 'Service unhealthy',
      details: {
        status: 'degraded',
        error: 'Service Unavailable',
      },
    });
  });
});
