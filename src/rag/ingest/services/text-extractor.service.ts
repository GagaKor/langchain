import { Injectable } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import mammoth from 'mammoth';
import pdf from 'pdf-parse';
import JSZip from 'jszip';
import { OcrMode } from '../dto/ingest-files.dto';
import { OcrService } from './ocr.service';

export interface ExtractedSegment {
  text: string;
  pageOrSlide: number;
}

export interface FileExtractionResult {
  segments: ExtractedSegment[];
  extractionMethod: 'native' | 'ocr';
  reason?: string;
}

@Injectable()
export class TextExtractorService {
  constructor(private readonly ocrService: OcrService) {}

  async extractByFile(filePath: string, ocrMode: OcrMode = 'off'): Promise<FileExtractionResult> {
    const extension = extname(filePath).toLowerCase();

    switch (extension) {
      case '.pdf':
        return this.extractPdf(filePath, ocrMode);
      case '.docx':
        return {
          segments: await this.extractDocx(filePath),
          extractionMethod: 'native',
        };
      case '.pptx':
        return {
          segments: await this.extractPptx(filePath),
          extractionMethod: 'native',
        };
      case '.txt':
      case '.md':
        return {
          segments: await this.extractPlainText(filePath),
          extractionMethod: 'native',
        };
      default:
        return {
          segments: [],
          extractionMethod: 'native',
        };
    }
  }

  private async extractPdf(filePath: string, ocrMode: OcrMode): Promise<FileExtractionResult> {
    const nativeSegments = await this.extractPdfNative(filePath);
    if (nativeSegments.length > 0) {
      return {
        segments: nativeSegments,
        extractionMethod: 'native',
      };
    }

    if (ocrMode === 'auto') {
      try {
        const ocrSegments = await this.ocrService.extractPdf(filePath);
        return {
          segments: ocrSegments,
          extractionMethod: 'ocr',
          reason:
            ocrSegments.length === 0 ? 'OCR completed but no text content was detected.' : undefined,
        };
      } catch (error) {
        return {
          segments: [],
          extractionMethod: 'ocr',
          reason: error instanceof Error ? error.message : 'OCR extraction failed',
        };
      }
    }

    return {
      segments: [],
      extractionMethod: 'native',
    };
  }

  private async extractPdfNative(filePath: string): Promise<ExtractedSegment[]> {
    const buffer = await readFile(filePath);
    const parsed = await pdf(buffer);

    if (!parsed.text || !parsed.text.trim()) {
      return [];
    }

    const pageCandidates = parsed.text
      .split(/\f+/)
      .map((page) => page.trim())
      .filter(Boolean);

    if (pageCandidates.length > 1) {
      return pageCandidates.map((text, index) => ({
        text,
        pageOrSlide: index + 1,
      }));
    }

    return parsed.text
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)
      .map((text, index) => ({
        text,
        pageOrSlide: index + 1,
      }));
  }

  private async extractDocx(filePath: string): Promise<ExtractedSegment[]> {
    const result = await mammoth.extractRawText({ path: filePath });

    return result.value
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)
      .map((text, index) => ({
        text,
        pageOrSlide: index + 1,
      }));
  }

  private async extractPptx(filePath: string): Promise<ExtractedSegment[]> {
    const buffer = await readFile(filePath);
    const zip = await JSZip.loadAsync(buffer);

    const slideFiles = Object.keys(zip.files)
      .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
      .sort((a, b) => {
        const aNumber = Number(a.match(/slide(\d+)\.xml$/)?.[1] ?? 0);
        const bNumber = Number(b.match(/slide(\d+)\.xml$/)?.[1] ?? 0);
        return aNumber - bNumber;
      });

    const segments: ExtractedSegment[] = [];

    for (const slideFile of slideFiles) {
      const slideEntry = zip.files[slideFile];
      if (!slideEntry) {
        continue;
      }

      const xml = await slideEntry.async('string');
      const textRuns = Array.from(xml.matchAll(/<a:t>(.*?)<\/a:t>/g), (m) => this.decodeXml(m[1]))
        .map((line) => line.trim())
        .filter(Boolean);

      if (textRuns.length === 0) {
        continue;
      }

      const slideNumber = Number(slideFile.match(/slide(\d+)\.xml$/)?.[1] ?? 0);

      segments.push({
        text: textRuns.join('\n'),
        pageOrSlide: slideNumber,
      });
    }

    return segments;
  }

  private async extractPlainText(filePath: string): Promise<ExtractedSegment[]> {
    const text = await readFile(filePath, 'utf-8');

    return text
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)
      .map((content, index) => ({
        text: content,
        pageOrSlide: index + 1,
      }));
  }

  private decodeXml(value: string): string {
    return value
      .replaceAll('&amp;', '&')
      .replaceAll('&lt;', '<')
      .replaceAll('&gt;', '>')
      .replaceAll('&quot;', '"')
      .replaceAll('&apos;', "'");
  }
}
