export const DEFAULT_COLLECTION_NAME = 'mvp_docs';
export const DEFAULT_CHROMA_URL = 'http://localhost:8000';

export const CHUNK_SIZE = 1000;
export const CHUNK_OVERLAP = 150;

export const SUPPORTED_EXTENSIONS = ['.pdf', '.docx', '.pptx', '.txt', '.md'];

export const EXTRACTION_FAILURE_MESSAGE =
  'Text extraction failed or empty content. Scanned/image-based files are not supported in MVP.';
