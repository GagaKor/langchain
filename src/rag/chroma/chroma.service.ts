import {
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Document } from '@langchain/core/documents';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import type { Where } from 'chromadb';
import { DEFAULT_CHROMA_URL, DEFAULT_COLLECTION_NAME } from '../shared/constants';
import { OllamaService } from '../llm/ollama.service';

@Injectable()
export class ChromaService {
  private readonly chromaUrl = process.env.CHROMA_URL ?? DEFAULT_CHROMA_URL;
  private readonly collectionName = process.env.COLLECTION_NAME ?? DEFAULT_COLLECTION_NAME;

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

    const vectorStore = new Chroma(this.getEmbeddings(), {
      collectionName,
      url: this.chromaUrl,
    });

    await vectorStore.addDocuments(docs);
    return docs.length;
  }

  async similaritySearchWithScore(
    query: string,
    topK: number,
    filters?: Where,
    collectionName = this.collectionName,
  ): Promise<Array<[Document, number]>> {
    const vectorStore = new Chroma(this.getEmbeddings(), {
      collectionName,
      url: this.chromaUrl,
    });

    try {
      return await vectorStore.similaritySearchWithScore(query, topK, filters);
    } catch {
      throw new InternalServerErrorException('Failed to run similarity search');
    }
  }

  private getEmbeddings() {
    return this.ollamaService.getEmbeddings();
  }
}
