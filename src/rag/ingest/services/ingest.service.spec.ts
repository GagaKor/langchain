import { Test, TestingModule } from '@nestjs/testing';
import { Document } from '@langchain/core/documents';
import { IngestService } from './ingest.service';
import { TextExtractorService } from './text-extractor.service';
import { ChunkingService } from './chunking.service';
import { ChromaService } from '../../chroma/chroma.service';

describe('IngestService', () => {
  let service: IngestService;
  let chunkingService: ChunkingService;
  let chromaService: ChromaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngestService,
        {
          provide: TextExtractorService,
          useValue: {
            extractByFile: jest.fn(),
          },
        },
        {
          provide: ChunkingService,
          useValue: {
            chunkSegments: jest.fn(),
          },
        },
        {
          provide: ChromaService,
          useValue: {
            addDocuments: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<IngestService>(IngestService);
    chunkingService = module.get<ChunkingService>(ChunkingService);
    chromaService = module.get<ChromaService>(ChromaService);
  });

  it('ingests inline text', async () => {
    const docs = [new Document({ pageContent: 'hello', metadata: {} })];
    jest.spyOn(chunkingService, 'chunkSegments').mockResolvedValue(docs);
    jest.spyOn(chromaService, 'addDocuments').mockResolvedValue(1);

    const ingested = await service.ingestText({ text: 'hello' });

    expect(ingested).toBe(1);
  });
});
