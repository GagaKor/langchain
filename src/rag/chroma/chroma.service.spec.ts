import { Document } from '@langchain/core/documents';
import { ChromaService } from './chroma.service';

describe('ChromaService', () => {
  const embedDocuments = jest.fn();
  const embedQuery = jest.fn();
  const fetchMock = jest.fn();
  let service: ChromaService;

  beforeEach(() => {
    embedDocuments.mockReset();
    embedQuery.mockReset();
    fetchMock.mockReset();
    global.fetch = fetchMock as typeof fetch;
    service = new ChromaService({
      getEmbeddings: () => ({
        embedDocuments,
        embedQuery,
      }),
    } as never);
  });

  it('creates or reuses a v1 collection and upserts documents', async () => {
    embedDocuments.mockResolvedValue([[0.1, 0.2]]);
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'collection-id',
          name: 'mvp_docs',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => null,
      });

    await expect(
      service.addDocuments([
        new Document({
          pageContent: 'hello',
          metadata: { chunkId: 'chunk-1', source: 'inline-text' },
        }),
      ]),
    ).resolves.toBe(1);

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://localhost:8000/api/v1/collections?tenant=default_tenant&database=default_database',
      expect.objectContaining({
        method: 'POST',
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://localhost:8000/api/v1/collections/collection-id/upsert',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          ids: ['chunk-1'],
          embeddings: [[0.1, 0.2]],
          metadatas: [{ chunkId: 'chunk-1', source: 'inline-text' }],
          documents: ['hello'],
        }),
      }),
    );
  });

  it('queries via the v1 API and maps results to langchain documents', async () => {
    embedQuery.mockResolvedValue([0.3, 0.4]);
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'collection-id',
          name: 'mvp_docs',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          documents: [['retrieved text']],
          metadatas: [[{ source: 'sample.txt', chunkId: 'chunk-1' }]],
          distances: [[0.12]],
        }),
      });

    await expect(service.similaritySearchWithScore('question', 3, { project: 'mvp' })).resolves.toEqual(
      [
        [
          expect.objectContaining({
            pageContent: 'retrieved text',
            metadata: { source: 'sample.txt', chunkId: 'chunk-1' },
          }),
          0.12,
        ],
      ],
    );

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://localhost:8000/api/v1/collections/collection-id/query',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          query_embeddings: [[0.3, 0.4]],
          n_results: 3,
          where: { project: 'mvp' },
          include: ['documents', 'metadatas', 'distances'],
        }),
      }),
    );
  });
});
