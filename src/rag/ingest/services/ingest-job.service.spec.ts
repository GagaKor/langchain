import { Test, TestingModule } from '@nestjs/testing';
import { IngestJobService } from './ingest-job.service';
import { IngestService } from './ingest.service';
import { ChromaService } from '../../chroma/chroma.service';

describe('IngestJobService', () => {
  let service: IngestJobService;
  let ingestService: IngestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngestJobService,
        {
          provide: IngestService,
          useValue: {
            ingestFile: jest.fn(),
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

    service = module.get<IngestJobService>(IngestJobService);
    ingestService = module.get<IngestService>(IngestService);
  });

  it('queues files and eventually completes the job', async () => {
    jest.spyOn(ingestService, 'ingestFile').mockResolvedValue({
      filename: 'sample.txt',
      docId: 'doc-1',
      ingested: 2,
      status: 'ok',
      extractionMethod: 'native',
    });

    const job = service.queueFiles({
      files: [{ originalname: 'sample.txt', path: '/tmp/sample.txt' }],
      ocrMode: 'off',
    });

    expect(job.status).toBe('queued');

    await new Promise((resolve) => setImmediate(resolve));

    expect(service.getJob(job.jobId)).toEqual(
      expect.objectContaining({
        status: 'completed',
        summary: {
          total: 1,
          succeeded: 1,
          failed: 0,
        },
        files: [
          expect.objectContaining({
            filename: 'sample.txt',
            status: 'ok',
            docId: 'doc-1',
            extractionMethod: 'native',
          }),
        ],
      }),
    );
  });
});
