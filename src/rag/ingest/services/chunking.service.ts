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
    addStartIndex: true,
  });

  async chunkSegments(
    segments: ExtractedSegment[],
    metadata: Record<string, unknown>,
  ): Promise<Document[]> {
    const output: Document[] = [];

    for (const segment of segments) {
      const baseMetadata = { ...metadata, pageOrSlide: segment.pageOrSlide };
      const chunked = await this.splitter.createDocuments(
        [segment.text],
        [baseMetadata],
      );

      chunked.forEach((doc, index) => {
        const startOffset = this.getStartIndex(doc.metadata.start_index);
        const chunkId = `${String(baseMetadata.docId)}-${segment.pageOrSlide}-${index + 1}`;

        doc.metadata = {
          ...doc.metadata,
          chunkId,
          startOffset,
          endOffset: startOffset + doc.pageContent.length,
        };
      });

      output.push(...chunked);
    }

    return output;
  }

  private getStartIndex(value: unknown): number {
    return typeof value === 'number' && value >= 0 ? value : 0;
  }
}
