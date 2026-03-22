import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'node:fs';
import { extname } from 'node:path';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { IngestService } from './services/ingest.service';
import { IngestTextDto } from './dto/ingest-text.dto';
import { IngestFilesDto } from './dto/ingest-files.dto';
import { ChromaService } from '../chroma/chroma.service';
import { IngestJobService } from './services/ingest-job.service';

interface UploadedFile {
  originalname: string;
  path: string;
}

@ApiTags('ingest')
@Controller('ingest')
export class IngestController {
  constructor(
    private readonly ingestService: IngestService,
    private readonly ingestJobService: IngestJobService,
    private readonly chromaService: ChromaService,
  ) {}

  @Post('text')
  async ingestText(@Body() body: IngestTextDto) {
    const ingested = await this.ingestService.ingestText({
      text: body.text,
      metadata: body.metadata,
    });

    return {
      ingested,
      collection: this.chromaService.getCollectionName(),
    };
  }

  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
        project: { type: 'string' },
        docType: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
        ocrMode: { type: 'string', enum: ['off', 'auto'] },
      },
    },
  })
  @Post('files')
  @UseInterceptors(
    FilesInterceptor('files', 20, {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const destination = 'data/uploads';
          if (!existsSync(destination)) {
            mkdirSync(destination, { recursive: true });
          }
          cb(null, destination);
        },
        filename: (_req, file, cb) => {
          const extension = extname(file.originalname);
          const basename = file.originalname.replace(extension, '');
          const safeBasename = basename.replace(/[^a-zA-Z0-9-_]/g, '_');
          cb(null, `${Date.now()}-${safeBasename}${extension.toLowerCase()}`);
        },
      }),
    }),
  )
  async ingestFiles(@UploadedFiles() files: UploadedFile[], @Body() body: IngestFilesDto) {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one file is required');
    }

    return this.ingestJobService.queueFiles({
      files,
      project: body.project,
      docType: body.docType,
      createdAt: body.createdAt,
      ocrMode: body.ocrMode,
    });
  }

  @Get('jobs/:jobId')
  getIngestJob(@Param('jobId') jobId: string) {
    return this.ingestJobService.getJob(jobId);
  }
}
