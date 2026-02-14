import { Injectable } from '@nestjs/common';
import { Document } from '@langchain/core/documents';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { CHUNK_OVERLAP, CHUNK_SIZE } from '../../shared/constants';
import { ExtractedSegment } from './text-extractor.service';

@Injectable()
export class ChunkingService {
  private readonly splitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
  });

  async chunkSegments(
    segments: ExtractedSegment[],
    metadata: Record<string, unknown>,
  ): Promise<Document[]> {
    const output: Document[] = [];

    for (const segment of segments) {
      const baseMetadata: Record<string, unknown> = {
        ...metadata,
        pageOrSlide: segment.pageOrSlide,
      };
      const chunked = await this.splitter.createDocuments([segment.text], [baseMetadata]);

      let nextStartOffset = 0;
      chunked.forEach((doc, index) => {
        const startOffset = nextStartOffset;
        const chunkId = `${this.toMetadataString(baseMetadata.docId)}-${segment.pageOrSlide}-${index + 1}`;

        doc.metadata = {
          ...doc.metadata,
          chunkId,
          startOffset,
          endOffset: startOffset + doc.pageContent.length,
        };

        nextStartOffset = Math.max(0, startOffset + doc.pageContent.length - CHUNK_OVERLAP);
      });

      output.push(...chunked);
    }

    return output;
  }

  private toMetadataString(value: unknown): string {
    return typeof value === 'string' && value.length > 0 ? value : 'unknown-doc';
  }
}
