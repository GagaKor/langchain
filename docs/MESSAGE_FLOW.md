# Message Flow

## 1. 문서 목적

이 문서는 현재 프로젝트의 모듈 흐름과 서버 간 요청 흐름을 빠르게 파악하기 위한 문서다.  
서비스 책임 설명보다, 어떤 입력이 어느 모듈을 거쳐 어떤 외부 시스템으로 흘러가는지를 우선 정리한다.

이 저장소는 모노레포가 아니라 단일 NestJS RAG API 서버이며, 외부 시스템은 `Chroma` 와 `Ollama` 다.  
근거: [docs/REPOSITORY_MAP.md](./REPOSITORY_MAP.md), [README.md](../README.md)

## 2. 전체 흐름 요약

### 확실한 내용

- `Client -> Nest API -> RagModule -> 각 도메인 모듈 -> 외부 시스템(Chroma/Ollama) -> API 응답` 흐름으로 동작한다.  
  근거: [src/main.ts](../src/main.ts), [src/app.module.ts](../src/app.module.ts), [src/rag/rag.module.ts](../src/rag/rag.module.ts)

- 인덱싱 흐름은 `Client -> IngestController -> IngestService -> TextExtractorService/ChunkingService -> ChromaService -> Chroma` 다.  
  근거: [src/rag/ingest/ingest.controller.ts](../src/rag/ingest/ingest.controller.ts), [src/rag/ingest/services/ingest.service.ts](../src/rag/ingest/services/ingest.service.ts), [src/rag/ingest/services/text-extractor.service.ts](../src/rag/ingest/services/text-extractor.service.ts), [src/rag/ingest/services/chunking.service.ts](../src/rag/ingest/services/chunking.service.ts), [src/rag/chroma/chroma.service.ts](../src/rag/chroma/chroma.service.ts)

- 질의 흐름은 `Client -> QueryController -> QueryService -> ChromaService -> OllamaService -> API 응답` 이다.  
  근거: [src/rag/query/query.controller.ts](../src/rag/query/query.controller.ts), [src/rag/query/query.service.ts](../src/rag/query/query.service.ts), [src/rag/chroma/chroma.service.ts](../src/rag/chroma/chroma.service.ts), [src/rag/llm/ollama.service.ts](../src/rag/llm/ollama.service.ts)

- 헬스체크 흐름은 `Client -> HealthController -> HealthService -> ChromaService/OllamaService -> API 응답` 이다.  
  근거: [src/rag/health/health.controller.ts](../src/rag/health/health.controller.ts), [src/rag/health/health.service.ts](../src/rag/health/health.service.ts)

### 추정 내용

- 이 프로젝트에서 실질적인 서버 흐름은 "문서 적재 서버"와 "질의 응답 서버"가 분리된 것이 아니라, 하나의 API 프로세스 안에서 두 흐름을 모두 처리하는 구조로 운영되는 것으로 보인다.  
  근거: [src/rag/rag.module.ts](../src/rag/rag.module.ts), [README.md](../README.md)

## 3. 서버 부팅 흐름

### 확실한 내용

1. `src/main.ts` 에서 Nest 애플리케이션이 부팅된다.  
   근거: [src/main.ts](../src/main.ts)
2. 전역 `ValidationPipe` 와 `HttpExceptionFilter` 가 등록된다.  
   근거: [src/main.ts](../src/main.ts), [src/common/filters/http-exception.filter.ts](../src/common/filters/http-exception.filter.ts)
3. Swagger 문서가 `/docs` 에 연결된다.  
   근거: [src/main.ts](../src/main.ts)
4. `AppModule` 이 로드되고, 여기서 전역 `ConfigModule` 과 `RagModule` 이 연결된다.  
   근거: [src/app.module.ts](../src/app.module.ts)
5. `RagModule` 이 `VectorStoreModule`, `LlmModule`, `IngestModule`, `QueryModule`, `HealthModule` 을 로드한다.  
   근거: [src/rag/rag.module.ts](../src/rag/rag.module.ts)

### 텍스트 흐름

- `bootstrap`
  -> `NestFactory.create(AppModule)`
  -> `ConfigModule.forRoot`
  -> `RagModule`
  -> `VectorStoreModule`
  -> `LlmModule`
  -> `IngestModule`
  -> `QueryModule`
  -> `HealthModule`
  -> `listen(PORT)`

## 4. 모듈 의존 흐름

### 확실한 내용

- `AppModule -> RagModule`  
  근거: [src/app.module.ts](../src/app.module.ts)

- `RagModule -> VectorStoreModule, LlmModule, IngestModule, QueryModule, HealthModule`  
  근거: [src/rag/rag.module.ts](../src/rag/rag.module.ts)

- `VectorStoreModule -> ChromaModule`  
  근거: [src/rag/vector-store/vector-store.module.ts](../src/rag/vector-store/vector-store.module.ts)

- `ChromaModule -> LlmModule -> OllamaService`  
  근거: [src/rag/chroma/chroma.module.ts](../src/rag/chroma/chroma.module.ts), [src/rag/llm/llm.module.ts](../src/rag/llm/llm.module.ts), [src/rag/chroma/chroma.service.ts](../src/rag/chroma/chroma.service.ts)

- `IngestModule -> IngestController + IngestService + TextExtractorService + ChunkingService`  
  근거: [src/rag/ingest/ingest.module.ts](../src/rag/ingest/ingest.module.ts)

- `QueryModule -> QueryController + QueryService`  
  근거: [src/rag/query/query.module.ts](../src/rag/query/query.module.ts)

- `HealthModule -> HealthController + HealthService`  
  근거: [src/rag/health/health.module.ts](../src/rag/health/health.module.ts)

## 5. 인덱싱 흐름

### 5-1. 텍스트 직접 인덱싱

### 확실한 내용

1. 클라이언트가 `POST /ingest/text` 로 텍스트와 메타데이터를 보낸다.  
   근거: [src/rag/ingest/ingest.controller.ts](../src/rag/ingest/ingest.controller.ts)
2. `IngestController` 가 `IngestTextDto` 검증이 끝난 요청을 `IngestService.ingestText()` 로 전달한다.  
   근거: [src/rag/ingest/ingest.controller.ts](../src/rag/ingest/ingest.controller.ts), [src/rag/ingest/dto/ingest-text.dto.ts](../src/rag/ingest/dto/ingest-text.dto.ts)
3. `IngestService` 가 빈 텍스트를 거부하고 `docId` 와 기본 메타데이터를 만든다.  
   근거: [src/rag/ingest/services/ingest.service.ts](../src/rag/ingest/services/ingest.service.ts)
4. `ChunkingService` 가 입력 텍스트를 청크로 나누고 `chunkId`, `startOffset`, `endOffset` 를 부여한다.  
   근거: [src/rag/ingest/services/chunking.service.ts](../src/rag/ingest/services/chunking.service.ts)
5. `ChromaService.addDocuments()` 가 임베딩을 생성해 Chroma 컬렉션에 문서를 저장한다.  
   근거: [src/rag/chroma/chroma.service.ts](../src/rag/chroma/chroma.service.ts), [src/rag/llm/ollama.service.ts](../src/rag/llm/ollama.service.ts)
6. API 는 `ingested` 수와 `collection` 이름을 응답한다.  
   근거: [src/rag/ingest/ingest.controller.ts](../src/rag/ingest/ingest.controller.ts)

### 텍스트 흐름

- `Client`
  -> `POST /ingest/text`
  -> `ValidationPipe`
  -> `IngestController.ingestText`
  -> `IngestService.ingestText`
  -> `ChunkingService.chunkSegments`
  -> `ChromaService.addDocuments`
  -> `Ollama embeddings`
  -> `Chroma collection`
  -> `API response`

### 5-2. 파일 업로드 인덱싱

### 확실한 내용

1. 클라이언트가 `POST /ingest/files` 로 multipart 파일과 메타데이터를 보낸다.  
   근거: [src/rag/ingest/ingest.controller.ts](../src/rag/ingest/ingest.controller.ts)
2. `FilesInterceptor` 가 파일을 `data/uploads` 에 저장한다.  
   근거: [src/rag/ingest/ingest.controller.ts](../src/rag/ingest/ingest.controller.ts)
3. `IngestController` 가 업로드된 파일 목록을 순회하며 `IngestService.ingestFile()` 을 호출한다.  
   근거: [src/rag/ingest/ingest.controller.ts](../src/rag/ingest/ingest.controller.ts)
4. `IngestService` 가 확장자를 검사하고 지원하지 않으면 실패 결과를 반환한다.  
   근거: [src/rag/ingest/services/ingest.service.ts](../src/rag/ingest/services/ingest.service.ts), [src/rag/shared/constants.ts](../src/rag/shared/constants.ts)
5. 지원 파일이면 `TextExtractorService` 가 파일 형식별로 텍스트를 추출한다.  
   근거: [src/rag/ingest/services/text-extractor.service.ts](../src/rag/ingest/services/text-extractor.service.ts)
6. 추출 결과가 비어 있으면 실패 처리된다.  
   근거: [src/rag/ingest/services/ingest.service.ts](../src/rag/ingest/services/ingest.service.ts)
7. 추출 결과가 있으면 `ChunkingService` 가 청크를 만들고 `ChromaService` 가 저장한다.  
   근거: [src/rag/ingest/services/chunking.service.ts](../src/rag/ingest/services/chunking.service.ts), [src/rag/chroma/chroma.service.ts](../src/rag/chroma/chroma.service.ts)
8. API 는 파일별 `ok/failed` 결과와 `collection` 이름을 반환한다.  
   근거: [src/rag/ingest/ingest.controller.ts](../src/rag/ingest/ingest.controller.ts)

### 파일 형식별 내부 흐름

- `.pdf`
  -> `pdf-parse`
  -> 페이지 또는 문단 단위 세그먼트 생성  
  근거: [src/rag/ingest/services/text-extractor.service.ts](../src/rag/ingest/services/text-extractor.service.ts)

- `.docx`
  -> `mammoth.extractRawText`
  -> 문단 단위 세그먼트 생성  
  근거: [src/rag/ingest/services/text-extractor.service.ts](../src/rag/ingest/services/text-extractor.service.ts)

- `.pptx`
  -> `JSZip`
  -> `ppt/slides/slide*.xml` 파싱
  -> 슬라이드 단위 세그먼트 생성  
  근거: [src/rag/ingest/services/text-extractor.service.ts](../src/rag/ingest/services/text-extractor.service.ts)

- `.txt`, `.md`
  -> plain text read
  -> 문단 단위 세그먼트 생성  
  근거: [src/rag/ingest/services/text-extractor.service.ts](../src/rag/ingest/services/text-extractor.service.ts)

## 6. 질의 흐름

### 확실한 내용

1. 클라이언트가 `POST /query` 로 질문, `topK`, `filters` 를 보낸다.  
   근거: [src/rag/query/query.controller.ts](../src/rag/query/query.controller.ts), [src/rag/query/dto/query.dto.ts](../src/rag/query/dto/query.dto.ts)
2. `QueryController` 가 `QueryService.query()` 를 호출한다.  
   근거: [src/rag/query/query.controller.ts](../src/rag/query/query.controller.ts)
3. `QueryService` 가 `ChromaService.similaritySearchWithScore()` 로 검색을 수행한다.  
   근거: [src/rag/query/query.service.ts](../src/rag/query/query.service.ts), [src/rag/chroma/chroma.service.ts](../src/rag/chroma/chroma.service.ts)
4. 검색 결과가 없으면 즉시 `근거 부족` 응답을 반환한다.  
   근거: [src/rag/query/query.service.ts](../src/rag/query/query.service.ts)
5. 검색 결과가 있으면 citation 목록을 만든다.  
   근거: [src/rag/query/query.service.ts](../src/rag/query/query.service.ts)
6. `QueryService` 가 `OllamaService.getChatModel()` 로 LLM을 가져와 citation 기반 프롬프트를 만든다.  
   근거: [src/rag/query/query.service.ts](../src/rag/query/query.service.ts), [src/rag/llm/ollama.service.ts](../src/rag/llm/ollama.service.ts)
7. Ollama 응답을 받아 `answer`, `citations`, `retrieved` 형태로 반환한다.  
   근거: [src/rag/query/query.service.ts](../src/rag/query/query.service.ts)

### 텍스트 흐름

- `Client`
  -> `POST /query`
  -> `ValidationPipe`
  -> `QueryController.query`
  -> `QueryService.query`
  -> `ChromaService.similaritySearchWithScore`
  -> `Chroma vector search`
  -> `retrieved/citations 생성`
  -> `OllamaService.getChatModel`
  -> `ChatOllama.invoke`
  -> `answer/citations/retrieved response`

## 7. 헬스체크 흐름

### 확실한 내용

1. 클라이언트가 `GET /health` 를 호출한다.  
   근거: [src/rag/health/health.controller.ts](../src/rag/health/health.controller.ts)
2. `HealthController` 가 `HealthService.check()` 를 호출한다.  
   근거: [src/rag/health/health.controller.ts](../src/rag/health/health.controller.ts)
3. `HealthService` 가 `ChromaService.heartbeat()` 와 `OllamaService.heartbeat()` 를 병렬로 실행한다.  
   근거: [src/rag/health/health.service.ts](../src/rag/health/health.service.ts)
4. 둘 다 성공하면 `status=ok`, 하나라도 실패하면 `status=degraded` 를 반환한다.  
   근거: [src/rag/health/health.service.ts](../src/rag/health/health.service.ts)
5. `HealthController` 는 `degraded` 상태일 때 `503 ServiceUnavailableException` 을 던진다.  
   근거: [src/rag/health/health.controller.ts](../src/rag/health/health.controller.ts)

### 텍스트 흐름

- `Client`
  -> `GET /health`
  -> `HealthController.getHealth`
  -> `HealthService.check`
  -> `ChromaService.heartbeat`
  -> `OllamaService.heartbeat`
  -> `status aggregation`
  -> `200 or 503`

## 8. 외부 시스템 흐름

### 확실한 내용

- `API -> Chroma` 는 heartbeat 와 vector store 작업에 사용된다.  
  근거: [src/rag/chroma/chroma.service.ts](../src/rag/chroma/chroma.service.ts)

- `API -> Ollama` 는 embeddings 생성, chat model 호출, heartbeat 에 사용된다.  
  근거: [src/rag/llm/ollama.service.ts](../src/rag/llm/ollama.service.ts), [src/rag/chroma/chroma.service.ts](../src/rag/chroma/chroma.service.ts)

- 컨테이너 구성 기준 외부 서버 포트는 `Chroma: 8000`, `Ollama: 11434`, `API: 3000` 이다.  
  근거: [docker-compose.yml](../docker-compose.yml)

### 텍스트 그래프

- `client -> api-server -> chroma`
- `client -> api-server -> ollama`
- `client -> api-server -> chroma -> ollama embeddings`
- `client -> api-server -> chroma search -> ollama chat`

## 9. 실패 지점 흐름

### 확실한 내용

- 요청 DTO 검증 실패 시 `ValidationPipe` 에서 차단된다.  
  근거: [src/main.ts](../src/main.ts), [src/rag/ingest/dto/ingest-text.dto.ts](../src/rag/ingest/dto/ingest-text.dto.ts), [src/rag/query/dto/query.dto.ts](../src/rag/query/dto/query.dto.ts)

- 파일 업로드 시 파일이 없으면 `BadRequestException` 이 발생한다.  
  근거: [src/rag/ingest/ingest.controller.ts](../src/rag/ingest/ingest.controller.ts)

- 텍스트가 비어 있으면 `IngestService` 가 거부한다.  
  근거: [src/rag/ingest/services/ingest.service.ts](../src/rag/ingest/services/ingest.service.ts)

- 지원하지 않는 확장자나 추출 실패 파일은 파일별 `failed` 상태로 응답된다.  
  근거: [src/rag/ingest/services/ingest.service.ts](../src/rag/ingest/services/ingest.service.ts)

- Chroma 연결 실패 시 `ServiceUnavailableException` 또는 검색 실패 예외가 발생할 수 있다.  
  근거: [src/rag/chroma/chroma.service.ts](../src/rag/chroma/chroma.service.ts)

- Ollama 연결 실패 시 `ServiceUnavailableException` 이 발생할 수 있다.  
  근거: [src/rag/llm/ollama.service.ts](../src/rag/llm/ollama.service.ts)

- 전역 예외는 `HttpExceptionFilter` 가 `code/message/details` 형태로 응답 포맷을 통일한다.  
  근거: [src/common/filters/http-exception.filter.ts](../src/common/filters/http-exception.filter.ts)

## 10. 추천 읽기 순서

- 서버 전체 흐름을 볼 때  
  `src/main.ts -> src/app.module.ts -> src/rag/rag.module.ts`

- 인덱싱 흐름을 볼 때  
  `src/rag/ingest/ingest.controller.ts -> src/rag/ingest/services/ingest.service.ts -> src/rag/ingest/services/text-extractor.service.ts -> src/rag/ingest/services/chunking.service.ts -> src/rag/chroma/chroma.service.ts`

- 질의 흐름을 볼 때  
  `src/rag/query/query.controller.ts -> src/rag/query/query.service.ts -> src/rag/chroma/chroma.service.ts -> src/rag/llm/ollama.service.ts`

- 장애 흐름을 볼 때  
  `src/rag/health/health.controller.ts -> src/rag/health/health.service.ts -> src/rag/chroma/chroma.service.ts -> src/rag/llm/ollama.service.ts -> src/common/filters/http-exception.filter.ts`
