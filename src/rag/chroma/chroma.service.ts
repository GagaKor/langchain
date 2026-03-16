import {
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Document } from '@langchain/core/documents';
import { randomUUID } from 'node:crypto';
import type { Where } from 'chromadb';
import {
  DEFAULT_CHROMA_DATABASE,
  DEFAULT_CHROMA_TENANT,
  DEFAULT_CHROMA_URL,
  DEFAULT_COLLECTION_NAME,
} from '../shared/constants';
import { OllamaService } from '../llm/ollama.service';

interface ChromaCollectionResponse {
  id: string;
  name: string;
}

interface ChromaQueryResponse {
  ids?: string[][];
  distances?: number[][];
  metadatas?: Array<Array<Record<string, unknown> | null>>;
  documents?: Array<Array<string | null>>;
}

@Injectable()
export class ChromaService {
  private readonly chromaUrl = process.env.CHROMA_URL ?? DEFAULT_CHROMA_URL;
  private readonly collectionName = process.env.COLLECTION_NAME ?? DEFAULT_COLLECTION_NAME;
  private readonly tenant = process.env.CHROMA_TENANT ?? DEFAULT_CHROMA_TENANT;
  private readonly database = process.env.CHROMA_DATABASE ?? DEFAULT_CHROMA_DATABASE;
  private collectionIdPromise?: Promise<string>;

  constructor(private readonly ollamaService: OllamaService) {}

  async heartbeat(): Promise<void> {
    try {
      const response = await fetch(`${this.chromaUrl}/api/v1/heartbeat`);
      if (!response.ok) {
        throw new Error(`Chroma heartbeat failed with status ${response.status}`);
      }
    } catch {
      throw new ServiceUnavailableException('Failed to connect to Chroma server');
    }
  }

  getCollectionName(): string {
    return this.collectionName;
  }

  async addDocuments(docs: Document[], collectionName = this.collectionName): Promise<number> {
    if (docs.length === 0) {
      return 0;
    }

    const embeddings = await this.getEmbeddings().embedDocuments(
      docs.map(({ pageContent }) => pageContent),
    );
    const collectionId = await this.getCollectionId(collectionName);

    await this.request<void>(`/api/v1/collections/${collectionId}/upsert`, {
      method: 'POST',
      body: JSON.stringify({
        ids: docs.map(({ metadata }) =>
          typeof metadata?.chunkId === 'string' ? metadata.chunkId : randomUUID(),
        ),
        embeddings,
        metadatas: docs.map(({ metadata }) => metadata ?? {}),
        documents: docs.map(({ pageContent }) => pageContent),
      }),
    });

    return docs.length;
  }

  async similaritySearchWithScore(
    query: string,
    topK: number,
    filters?: Where,
    collectionName = this.collectionName,
  ): Promise<Array<[Document, number]>> {
    try {
      const collectionId = await this.getCollectionId(collectionName);
      const queryEmbedding = await this.getEmbeddings().embedQuery(query);
      const response = await this.request<ChromaQueryResponse>(
        `/api/v1/collections/${collectionId}/query`,
        {
          method: 'POST',
          body: JSON.stringify({
            query_embeddings: [queryEmbedding],
            n_results: topK,
            where: filters ?? {},
            include: ['documents', 'metadatas', 'distances'],
          }),
        },
      );

      const documents = response.documents?.[0] ?? [];
      const metadatas = response.metadatas?.[0] ?? [];
      const distances = response.distances?.[0] ?? [];

      return documents.flatMap((pageContent, index) => {
        if (typeof pageContent !== 'string') {
          return [];
        }

        return [
          [
            new Document({
              pageContent,
              metadata: metadatas[index] ?? {},
            }),
            distances[index] ?? 0,
          ] as [Document, number],
        ];
      });
    } catch {
      throw new InternalServerErrorException('Failed to run similarity search');
    }
  }

  private getEmbeddings() {
    return this.ollamaService.getEmbeddings();
  }

  private async getCollectionId(collectionName: string): Promise<string> {
    if (collectionName !== this.collectionName) {
      return this.createOrGetCollection(collectionName);
    }

    if (!this.collectionIdPromise) {
      this.collectionIdPromise = this.createOrGetCollection(collectionName);
    }

    return this.collectionIdPromise;
  }

  private async createOrGetCollection(collectionName: string): Promise<string> {
    const collection = await this.request<ChromaCollectionResponse>(
      `/api/v1/collections?tenant=${encodeURIComponent(this.tenant)}&database=${encodeURIComponent(this.database)}`,
      {
        method: 'POST',
        body: JSON.stringify({
          name: collectionName,
          get_or_create: true,
        }),
      },
    );

    return collection.id;
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.chromaUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Chroma request failed with status ${response.status}`);
    }

    return (await response.json()) as T;
  }
}
