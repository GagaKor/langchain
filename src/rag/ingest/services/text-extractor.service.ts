import { Injectable } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import mammoth from 'mammoth';
import pdf from 'pdf-parse';
import JSZip from 'jszip';

export interface ExtractedSegment {
  text: string;
  pageOrSlide: number;
}

@Injectable()
export class TextExtractorService {
  async extractByFile(filePath: string): Promise<ExtractedSegment[]> {
    const extension = extname(filePath).toLowerCase();

    switch (extension) {
      case '.pdf':
        return this.extractPdf(filePath);
      case '.docx':
        return this.extractDocx(filePath);
      case '.pptx':
        return this.extractPptx(filePath);
      case '.txt':
      case '.md':
        return this.extractPlainText(filePath);
      default:
        return [];
    }
  }

  private async extractPdf(filePath: string): Promise<ExtractedSegment[]> {
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
      const textRuns = Array.from(xml.matchAll(/<a:t>(.*?)<\/a:t>/g), (m) =>
        this.decodeXml(m[1]),
      )
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
