import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { IngestController } from './ingest.controller';
import { IngestService } from './services/ingest.service';
import { IngestJobService } from './services/ingest-job.service';
import { ChromaService } from '../chroma/chroma.service';

describe('IngestController', () => {
  let controller: IngestController;
  let ingestService: IngestService;
  let ingestJobService: IngestJobService;
  let chromaService: ChromaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IngestController],
      providers: [
        {
          provide: IngestService,
          useValue: {
            ingestText: jest.fn(),
          },
        },
        {
          provide: IngestJobService,
          useValue: {
            queueFiles: jest.fn(),
            getJob: jest.fn(),
          },
        },
        {
          provide: ChromaService,
          useValue: {
            getCollectionName: jest.fn().mockReturnValue('mvp_docs'),
          },
        },
      ],
    }).compile();

    controller = module.get(IngestController);
    ingestService = module.get(IngestService);
    ingestJobService = module.get(IngestJobService);
    chromaService = module.get(ChromaService);
  });

  it('returns ingested count and collection for inline text', async () => {
    jest.spyOn(ingestService, 'ingestText').mockResolvedValue(3);

    await expect(
      controller.ingestText({
        text: 'hello',
        metadata: { project: 'demo' },
      }),
    ).resolves.toEqual({
      ingested: 3,
      collection: 'mvp_docs',
    });

    expect(ingestService.ingestText).toHaveBeenCalledWith({
      text: 'hello',
      metadata: { project: 'demo' },
    });
    expect(chromaService.getCollectionName).toHaveBeenCalled();
  });

  it('queues uploaded files with request metadata', async () => {
    const queuedJob = { jobId: 'job-1', status: 'queued' };
    jest.spyOn(ingestJobService, 'queueFiles').mockReturnValue(queuedJob as never);

    const files = [{ originalname: 'sample.pdf', path: '/tmp/sample.pdf' }];
    const body = {
      project: 'mvp',
      docType: 'report',
      createdAt: '2025-03-16T12:00:00.000Z',
      ocrMode: 'auto' as const,
    };

    await expect(controller.ingestFiles(files, body)).resolves.toBe(queuedJob);
    expect(ingestJobService.queueFiles).toHaveBeenCalledWith({
      files,
      ...body,
    });
  });

  it('rejects file ingest when no files are uploaded', async () => {
    await expect(controller.ingestFiles([], {})).rejects.toBeInstanceOf(BadRequestException);
    expect(ingestJobService.queueFiles).not.toHaveBeenCalled();
  });

  it('returns an ingest job by id', () => {
    const job = { jobId: 'job-1', status: 'completed' };
    jest.spyOn(ingestJobService, 'getJob').mockReturnValue(job as never);

    expect(controller.getIngestJob('job-1')).toBe(job);
    expect(ingestJobService.getJob).toHaveBeenCalledWith('job-1');
  });
});
