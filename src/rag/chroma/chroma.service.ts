import {
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Document } from '@langchain/core/documents';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { OpenAIEmbeddings } from '@langchain/openai';
import { ChromaClient } from 'chromadb';
import {
  DEFAULT_CHROMA_URL,
  DEFAULT_COLLECTION_NAME,
} from '../shared/constants';

@Injectable()
export class ChromaService {
  private readonly chromaUrl = process.env.CHROMA_URL ?? DEFAULT_CHROMA_URL;
  private readonly collectionName =
    process.env.COLLECTION_NAME ?? DEFAULT_COLLECTION_NAME;

  private readonly chromaClient = new ChromaClient({ path: this.chromaUrl });

  async heartbeat(): Promise<void> {
    try {
      await this.chromaClient.heartbeat();
    } catch (error) {
      throw new ServiceUnavailableException('Failed to connect to Chroma server');
    }
  }

  getCollectionName(): string {
    return this.collectionName;
  }

  async addDocuments(
    docs: Document[],
    collectionName = this.collectionName,
  ): Promise<number> {
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
    filters?: Record<string, unknown>,
    collectionName = this.collectionName,
  ): Promise<Array<[Document, number]>> {
    const vectorStore = new Chroma(this.getEmbeddings(), {
      collectionName,
      url: this.chromaUrl,
    });

    try {
      return await vectorStore.similaritySearchWithScore(query, topK, filters);
    } catch (error) {
      throw new InternalServerErrorException('Failed to run similarity search');
    }
  }

  private getEmbeddings(): OpenAIEmbeddings {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new ServiceUnavailableException('OPENAI_API_KEY is missing');
    }

    return new OpenAIEmbeddings({
      apiKey,
      model: 'text-embedding-3-small',
    });
  }
}
