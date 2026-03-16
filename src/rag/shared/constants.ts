export const DEFAULT_COLLECTION_NAME = 'mvp_docs';
export const DEFAULT_CHROMA_URL = 'http://localhost:8000';
export const DEFAULT_CHROMA_TENANT = 'default_tenant';
export const DEFAULT_CHROMA_DATABASE = 'default_database';
export const DEFAULT_OLLAMA_URL = 'http://localhost:11434';
export const DEFAULT_CHAT_MODEL = 'llama3:8b';
export const DEFAULT_EMBED_MODEL = 'nomic-embed-text';

export const CHUNK_SIZE = 1000;
export const CHUNK_OVERLAP = 150;

export const SUPPORTED_EXTENSIONS = ['.pdf', '.docx', '.pptx', '.txt', '.md'];

export const EXTRACTION_FAILURE_MESSAGE =
  'Text extraction failed or empty content. Scanned/image-based files are not supported in MVP.';
