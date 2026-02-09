import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { extname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { ChromaService } from '../../chroma/chroma.service';
import {
  EXTRACTION_FAILURE_MESSAGE,
  SUPPORTED_EXTENSIONS,
} from '../../shared/constants';
import { ChunkingService } from './chunking.service';
import { TextExtractorService } from './text-extractor.service';

export interface IngestedFileResult {
  filename: string;
  docId: string;
  ingested: number;
  status: 'ok' | 'failed';
  reason?: string;
}

interface IngestTextInput {
  text: string;
  metadata?: Record<string, unknown>;
}

interface IngestFileInput {
  file: {
    originalname: string;
    path: string;
  };
  project?: string;
  docType?: string;
  createdAt?: string;
}

@Injectable()
export class IngestService {
  constructor(
    private readonly textExtractorService: TextExtractorService,
    private readonly chunkingService: ChunkingService,
    private readonly chromaService: ChromaService,
  ) {}

  async ingestText(input: IngestTextInput): Promise<number> {
    if (!input.text.trim()) {
      throw new BadRequestException('text must not be empty');
    }

    const docId = randomUUID();
    const baseMetadata = this.sanitizeMetadata({
      docId,
      source: 'inline-text',
      docType: 'text',
      createdAt: new Date().toISOString(),
      pageOrSlide: 1,
      ...(input.metadata ?? {}),
    });

    const docs = await this.chunkingService.chunkSegments(
      [{ text: input.text, pageOrSlide: 1 }],
      baseMetadata,
    );

    return this.chromaService.addDocuments(docs);
  }

  async ingestFile(input: IngestFileInput): Promise<IngestedFileResult> {
    const docId = randomUUID();
    const extension = extname(input.file.originalname).toLowerCase();

    if (!SUPPORTED_EXTENSIONS.includes(extension)) {
      return {
        filename: input.file.originalname,
        docId,
        ingested: 0,
        status: 'failed',
        reason: `Unsupported file type: ${extension || 'unknown'}`,
      };
    }

    const segments = await this.textExtractorService.extractByFile(input.file.path);

    if (segments.length === 0) {
      return {
        filename: input.file.originalname,
        docId,
        ingested: 0,
        status: 'failed',
        reason: EXTRACTION_FAILURE_MESSAGE,
      };
    }

    const baseMetadata = this.sanitizeMetadata({
      source: input.file.originalname,
      docId,
      docType: input.docType ?? extension.replace('.', ''),
      createdAt: input.createdAt ?? new Date().toISOString(),
      project: input.project ?? null,
    });

    const documents = await this.chunkingService.chunkSegments(
      segments,
      baseMetadata,
    );

    const ingested = await this.chromaService.addDocuments(documents);

    return {
      filename: input.file.originalname,
      docId,
      ingested,
      status: 'ok',
    };
  }

  private sanitizeMetadata(
    metadata: Record<string, unknown>,
  ): Record<string, string | number | boolean | null> {
    return Object.fromEntries(
      Object.entries(metadata).map(([key, value]) => {
        if (
          value === null ||
          typeof value === 'string' ||
          typeof value === 'number' ||
          typeof value === 'boolean'
        ) {
          return [key, value];
        }

        return [key, JSON.stringify(value)];
      }),
    );
  }
}
