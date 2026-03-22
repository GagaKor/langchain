import { Document } from '@langchain/core/documents';
import { ChunkingService } from './chunking.service';

describe('ChunkingService', () => {
  let service: ChunkingService;

  beforeEach(() => {
    service = new ChunkingService();
  });

  it('adds chunk metadata and offsets for each split segment', async () => {
    const createDocuments = jest
      .spyOn((service as { splitter: { createDocuments: typeof service['chunkSegments'] } }).splitter, 'createDocuments')
      .mockResolvedValue([
        new Document({ pageContent: 'alpha', metadata: { pageOrSlide: 3 } }),
        new Document({ pageContent: 'beta', metadata: { pageOrSlide: 3 } }),
      ] as never);

    const result = await service.chunkSegments(
      [{ text: 'original', pageOrSlide: 3 }],
      { docId: 'doc-1', source: 'sample.txt' },
    );

    expect(createDocuments).toHaveBeenCalledWith(
      ['original'],
      [{ docId: 'doc-1', source: 'sample.txt', pageOrSlide: 3 }],
    );
    expect(result[0]).toEqual(
      expect.objectContaining({
        pageContent: 'alpha',
        metadata: expect.objectContaining({
          chunkId: 'doc-1-3-1',
          pageOrSlide: 3,
          startOffset: 0,
          endOffset: 5,
        }),
      }),
    );
    expect(result[1]).toEqual(
      expect.objectContaining({
        pageContent: 'beta',
        metadata: expect.objectContaining({
          chunkId: 'doc-1-3-2',
          pageOrSlide: 3,
          startOffset: 0,
          endOffset: 4,
        }),
      }),
    );
  });

  it('falls back to unknown-doc when docId metadata is missing', async () => {
    jest
      .spyOn((service as { splitter: { createDocuments: typeof service['chunkSegments'] } }).splitter, 'createDocuments')
      .mockResolvedValue([new Document({ pageContent: 'hello', metadata: {} })] as never);

    const [result] = await service.chunkSegments([{ text: 'hello', pageOrSlide: 1 }], {});

    expect(result.metadata).toEqual(
      expect.objectContaining({
        chunkId: 'unknown-doc-1-1',
      }),
    );
  });
});
