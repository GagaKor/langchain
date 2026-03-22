import { Test, TestingModule } from '@nestjs/testing';
import { Document } from '@langchain/core/documents';
import { QueryService } from './query.service';
import { ChromaService } from '../chroma/chroma.service';
import { OllamaService } from '../llm/ollama.service';

describe('QueryService', () => {
  let service: QueryService;
  let chromaService: ChromaService;
  let ollamaService: OllamaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueryService,
        {
          provide: ChromaService,
          useValue: {
            similaritySearchWithScore: jest.fn(),
          },
        },
        {
          provide: OllamaService,
          useValue: {
            getChatModel: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<QueryService>(QueryService);
    chromaService = module.get<ChromaService>(ChromaService);
    ollamaService = module.get<OllamaService>(OllamaService);
  });

  it('returns 부족 when no documents', async () => {
    jest.spyOn(chromaService, 'similaritySearchWithScore').mockResolvedValue([]);

    const result = await service.query({ question: '질문' });

    expect(result.answer).toContain('근거 부족');
    expect(result.citations).toHaveLength(0);
  });

  it('uses ollama when documents exist', async () => {
    const doc = new Document({
      pageContent: '테스트 문서 내용',
      metadata: { source: 'sample', docId: 'doc1', pageOrSlide: 1, chunkId: 'c1' },
    });
    jest.spyOn(chromaService, 'similaritySearchWithScore').mockResolvedValue([[doc, 0.1]]);

    const invoke = jest.fn().mockResolvedValue({ content: '답변' });
    jest.spyOn(ollamaService, 'getChatModel').mockReturnValue({
      invoke,
    } as never);

    const result = await service.query({ question: '질문' });

    expect(result.answer).toBe('답변');
    expect(result.citations).toHaveLength(1);
    expect(result.retrieved).toEqual([
      expect.objectContaining({
        source: 'sample',
        score: 0.1,
        excerpt: '테스트 문서 내용',
      }),
    ]);
    expect(invoke).toHaveBeenCalled();
  });

  it('uses default topK and forwards filters to chroma', async () => {
    jest.spyOn(chromaService, 'similaritySearchWithScore').mockResolvedValue([]);

    await service.query({ question: '질문', filters: { project: 'mvp' } });

    expect(chromaService.similaritySearchWithScore).toHaveBeenCalledWith('질문', 6, {
      project: 'mvp',
    });
  });

  it('truncates long excerpts and stringifies structured llm responses', async () => {
    const longText = 'a'.repeat(320);
    const doc = new Document({
      pageContent: longText,
      metadata: { source: 'long.txt', pageOrSlide: '1', chunkId: 10 },
    });
    jest.spyOn(chromaService, 'similaritySearchWithScore').mockResolvedValue([[doc, 0.42]]);

    const invoke = jest.fn().mockResolvedValue({ content: [{ type: 'text', text: '답변' }] });
    jest.spyOn(ollamaService, 'getChatModel').mockReturnValue({ invoke } as never);

    const result = await service.query({ question: '긴 질문', topK: 2 });

    expect(result.answer).toBe(JSON.stringify([{ type: 'text', text: '답변' }]));
    expect(result.citations).toEqual([
      {
        source: 'long.txt',
        docId: undefined,
        pageOrSlide: undefined,
        chunkId: undefined,
        excerpt: `${'a'.repeat(300)}...`,
      },
    ]);
  });
});
