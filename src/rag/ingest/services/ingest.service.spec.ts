import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { Document } from '@langchain/core/documents';
import { IngestService } from './ingest.service';
import { TextExtractorService } from './text-extractor.service';
import { ChunkingService } from './chunking.service';
import { ChromaService } from '../../chroma/chroma.service';

describe('IngestService', () => {
  let service: IngestService;
  let textExtractorService: TextExtractorService;
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
    textExtractorService = module.get<TextExtractorService>(TextExtractorService);
    chunkingService = module.get<ChunkingService>(ChunkingService);
    chromaService = module.get<ChromaService>(ChromaService);
  });

  it('ingests inline text', async () => {
    const docs = [new Document({ pageContent: 'hello', metadata: {} })];
    jest.spyOn(chunkingService, 'chunkSegments').mockResolvedValue(docs);
    jest.spyOn(chromaService, 'addDocuments').mockResolvedValue(1);

    const ingested = await service.ingestText({ text: 'hello' });

    expect(ingested).toBe(1);
    expect(chunkingService.chunkSegments).toHaveBeenCalledWith(
      [{ text: 'hello', pageOrSlide: 1 }],
      expect.objectContaining({
        source: 'inline-text',
        docType: 'text',
        pageOrSlide: 1,
      }),
    );
  });

  it('rejects blank inline text', async () => {
    await expect(service.ingestText({ text: '   ' })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns failed for unsupported file types', async () => {
    const result = await service.ingestFile({
      file: {
        originalname: 'plan.exe',
        path: '/tmp/plan.exe',
      },
    });

    expect(result).toEqual({
      filename: 'plan.exe',
      docId: expect.any(String),
      ingested: 0,
      status: 'failed',
      reason: 'Unsupported file type: .exe',
      extractionMethod: 'native',
    });
    expect(textExtractorService.extractByFile).not.toHaveBeenCalled();
  });

  it('returns failed when extraction is empty', async () => {
    jest.spyOn(textExtractorService, 'extractByFile').mockResolvedValue({
      segments: [],
      extractionMethod: 'native',
    });

    const result = await service.ingestFile({
      file: {
        originalname: 'sample.pdf',
        path: '/tmp/sample.pdf',
      },
    });

    expect(result).toEqual({
      filename: 'sample.pdf',
      docId: expect.any(String),
      ingested: 0,
      status: 'failed',
      reason: 'Text extraction failed or empty content. Scanned/image-based files are not supported in MVP.',
      extractionMethod: 'native',
    });
    expect(chunkingService.chunkSegments).not.toHaveBeenCalled();
  });

  it('ingests extracted file segments with sanitized metadata', async () => {
    jest.spyOn(textExtractorService, 'extractByFile').mockResolvedValue({
      segments: [
        {
          text: 'alpha',
          pageOrSlide: 3,
        },
      ],
      extractionMethod: 'native',
    });
    const docs = [
      new Document({
        pageContent: 'alpha',
        metadata: { chunkId: 'chunk-1' },
      }),
    ];
    jest.spyOn(chunkingService, 'chunkSegments').mockResolvedValue(docs);
    jest.spyOn(chromaService, 'addDocuments').mockResolvedValue(1);

    const result = await service.ingestFile({
      file: {
        originalname: 'sample.md',
        path: '/tmp/sample.md',
      },
      project: 'mvp',
      docType: 'brief',
      createdAt: '2025-03-16T12:00:00.000Z',
    });

    expect(result).toEqual({
      filename: 'sample.md',
      docId: expect.any(String),
      ingested: 1,
      status: 'ok',
      extractionMethod: 'native',
    });
    expect(chunkingService.chunkSegments).toHaveBeenCalledWith(
      [{ text: 'alpha', pageOrSlide: 3 }],
      expect.objectContaining({
        source: 'sample.md',
        docType: 'brief',
        createdAt: '2025-03-16T12:00:00.000Z',
        project: 'mvp',
        extractionMethod: 'native',
      }),
    );
    expect(chromaService.addDocuments).toHaveBeenCalledWith(docs);
  });

  it('stringifies non-primitive metadata values before chunking', async () => {
    const docs = [new Document({ pageContent: 'hello', metadata: {} })];
    jest.spyOn(chunkingService, 'chunkSegments').mockResolvedValue(docs);
    jest.spyOn(chromaService, 'addDocuments').mockResolvedValue(1);

    await service.ingestText({
      text: 'hello',
      metadata: {
        tags: ['alpha', 'beta'],
      },
    });

    expect(chunkingService.chunkSegments).toHaveBeenCalledWith(
      [{ text: 'hello', pageOrSlide: 1 }],
      expect.objectContaining({
        tags: JSON.stringify(['alpha', 'beta']),
      }),
    );
  });
});
