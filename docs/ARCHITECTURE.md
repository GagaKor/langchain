# Architecture

## 1. 문서 목적

이 문서는 현재 프로젝트의 시스템 전체 구조를 아키텍처 관점에서 설명하기 위한 문서다.  
단순 기능 나열보다 다음을 우선 정리한다.

- 시스템 경계와 주요 구성요소
- 모듈 계층과 의존 방향
- 외부 시스템과의 연결 구조
- 런타임 배포 구조
- 데이터가 어떤 계층을 거쳐 흐르는지
- 확장 시 영향을 받는 핵심 아키텍처 포인트

이 프로젝트는 모노레포가 아니라 단일 NestJS RAG API 서버이며, 외부 시스템으로 `Chroma` 와 `Ollama` 를 사용한다.  
근거: [docs/REPOSITORY_MAP.md](./REPOSITORY_MAP.md), [README.md](../README.md)

## 2. 시스템 개요

### 확실한 내용

- 시스템의 중심은 하나의 NestJS API 서버다.  
  근거: [src/main.ts](../src/main.ts), [src/app.module.ts](../src/app.module.ts)

- 이 API 서버는 내부적으로 `health`, `ingest`, `query` 세 도메인 모듈을 가진다.  
  근거: [src/rag/rag.module.ts](../src/rag/rag.module.ts)

- 문서 저장과 검색은 `Chroma` 가 담당하고, 임베딩 생성과 최종 응답 생성은 `Ollama` 가 담당한다.  
  근거: [src/rag/chroma/chroma.service.ts](../src/rag/chroma/chroma.service.ts), [src/rag/llm/ollama.service.ts](../src/rag/llm/ollama.service.ts)

- 파일 입력은 API 서버가 직접 받아 로컬 파일시스템 `data/uploads` 에 저장한 뒤 처리한다.  
  근거: [src/rag/ingest/ingest.controller.ts](../src/rag/ingest/ingest.controller.ts)

### 추정 내용

- 현재 구조는 MVP 단계에 맞춰 "애플리케이션 계층과 AI/벡터 저장소 계층만 분리한 단순 3계층 구조" 로 의도된 것으로 보인다.  
  근거: [README.md](../README.md), [docker-compose.yml](../docker-compose.yml)

## 3. 아키텍처 스타일

### 확실한 내용

- 애플리케이션 구조는 NestJS 모듈 기반의 모듈러 모놀리식 구조다.  
  근거: [src/app.module.ts](../src/app.module.ts), [src/rag/rag.module.ts](../src/rag/rag.module.ts)

- 런타임 관점에서는 다음 세 노드로 분리된다.
  - `api-server`
  - `chroma`
  - `ollama`  
  근거: [docker-compose.yml](../docker-compose.yml)

- API 내부 아키텍처는 `Controller -> Service -> External Adapter` 방향으로 흐른다.  
  근거: [src/rag/ingest/ingest.controller.ts](../src/rag/ingest/ingest.controller.ts), [src/rag/query/query.controller.ts](../src/rag/query/query.controller.ts), [src/rag/health/health.controller.ts](../src/rag/health/health.controller.ts), [src/rag/chroma/chroma.service.ts](../src/rag/chroma/chroma.service.ts), [src/rag/llm/ollama.service.ts](../src/rag/llm/ollama.service.ts)

### 텍스트 아키텍처 다이어그램

- `Client`
  -> `Nest API`
  -> `Domain Modules`
  -> `Chroma / Ollama`

- `Nest API`
  -> `Ingest`
  -> `Query`
  -> `Health`

- `Ingest`
  -> `TextExtractor`
  -> `Chunking`
  -> `Chroma`

- `Query`
  -> `Chroma Search`
  -> `Ollama Chat`

## 4. 계층 구조

### 4-1. 진입 계층

### 확실한 내용

- `src/main.ts` 는 애플리케이션 부트스트랩과 전역 정책 등록을 담당한다.  
  근거: [src/main.ts](../src/main.ts)

- 전역 정책으로 `ValidationPipe` 와 `HttpExceptionFilter` 가 적용된다.  
  근거: [src/main.ts](../src/main.ts), [src/common/filters/http-exception.filter.ts](../src/common/filters/http-exception.filter.ts)

### 4-2. 애플리케이션 조립 계층

### 확실한 내용

- `AppModule` 은 전역 설정과 RAG 기능 모듈을 조립하는 최상위 조립 계층이다.  
  근거: [src/app.module.ts](../src/app.module.ts)

- `RagModule` 은 실제 비즈니스 기능 모듈을 결합하는 애플리케이션 내부 조립 계층이다.  
  근거: [src/rag/rag.module.ts](../src/rag/rag.module.ts)

### 4-3. 도메인 모듈 계층

### 확실한 내용

- `IngestModule` 은 인덱싱 유스케이스를 담당한다.  
  근거: [src/rag/ingest/ingest.module.ts](../src/rag/ingest/ingest.module.ts)

- `QueryModule` 은 검색 기반 질의 응답 유스케이스를 담당한다.  
  근거: [src/rag/query/query.module.ts](../src/rag/query/query.module.ts)

- `HealthModule` 은 외부 의존성 상태 점검 유스케이스를 담당한다.  
  근거: [src/rag/health/health.module.ts](../src/rag/health/health.module.ts)

### 4-4. 인프라 어댑터 계층

### 확실한 내용

- `ChromaService` 는 벡터 저장소 어댑터다.  
  근거: [src/rag/chroma/chroma.service.ts](../src/rag/chroma/chroma.service.ts)

- `OllamaService` 는 LLM/임베딩 어댑터다.  
  근거: [src/rag/llm/ollama.service.ts](../src/rag/llm/ollama.service.ts)

- `TextExtractorService` 는 파일 형식별 텍스트 추출 어댑터다.  
  근거: [src/rag/ingest/services/text-extractor.service.ts](../src/rag/ingest/services/text-extractor.service.ts)

- `ChunkingService` 는 추출 텍스트를 검색 가능한 청크 단위로 재구성하는 내부 처리 컴포넌트다.  
  근거: [src/rag/ingest/services/chunking.service.ts](../src/rag/ingest/services/chunking.service.ts)

## 5. 의존 방향

### 확실한 내용

- 의존 방향은 상위 계층에서 하위 계층으로만 흐른다.
  - `main -> AppModule`
  - `AppModule -> RagModule`
  - `RagModule -> domain modules`
  - `domain modules -> infrastructure modules/services`
  - `infrastructure services -> external systems`  
  근거: [src/main.ts](../src/main.ts), [src/app.module.ts](../src/app.module.ts), [src/rag/rag.module.ts](../src/rag/rag.module.ts)

- `VectorStoreModule` 은 `ChromaModule` 을 감싸는 얇은 추상화 계층이다.  
  근거: [src/rag/vector-store/vector-store.module.ts](../src/rag/vector-store/vector-store.module.ts)

- `ChromaService` 는 임베딩 생성을 위해 `OllamaService` 에 의존한다.  
  근거: [src/rag/chroma/chroma.service.ts](../src/rag/chroma/chroma.service.ts)

- `QueryService` 는 검색과 생성 두 단계를 위해 `ChromaService` 와 `OllamaService` 둘 다에 의존한다.  
  근거: [src/rag/query/query.service.ts](../src/rag/query/query.service.ts)

- `HealthService` 도 동일하게 `ChromaService` 와 `OllamaService` 둘 다에 의존한다.  
  근거: [src/rag/health/health.service.ts](../src/rag/health/health.service.ts)

### 아키텍처 해석

- `OllamaService` 는 단순 채팅 모델 제공자만이 아니라, 임베딩 계층의 기반이기도 하다.
- 그래서 현재 구조에서는 `Ollama` 장애가 질의 응답뿐 아니라 문서 적재에도 직접 영향을 준다.
- 반대로 `Chroma` 장애는 적재와 검색 모두를 중단시킨다.

## 6. 핵심 데이터 흐름

### 6-1. 인덱싱 파이프라인

### 확실한 내용

- 텍스트 또는 파일 입력은 먼저 API 계층에서 검증된다.  
  근거: [src/main.ts](../src/main.ts), [src/rag/ingest/dto/ingest-text.dto.ts](../src/rag/ingest/dto/ingest-text.dto.ts), [src/rag/ingest/dto/ingest-files.dto.ts](../src/rag/ingest/dto/ingest-files.dto.ts)

- 파일 입력은 `data/uploads` 에 저장된 뒤 텍스트 추출 단계로 넘어간다.  
  근거: [src/rag/ingest/ingest.controller.ts](../src/rag/ingest/ingest.controller.ts)

- 추출된 세그먼트는 청킹 단계에서 검색 단위 문서로 재구성된다.  
  근거: [src/rag/ingest/services/chunking.service.ts](../src/rag/ingest/services/chunking.service.ts)

- 최종 문서는 Ollama 임베딩을 사용해 Chroma 컬렉션에 적재된다.  
  근거: [src/rag/chroma/chroma.service.ts](../src/rag/chroma/chroma.service.ts), [src/rag/llm/ollama.service.ts](../src/rag/llm/ollama.service.ts)

### 데이터 흐름 그래프

- `raw input`
  -> `DTO validation`
  -> `text extraction`
  -> `chunking`
  -> `embedding`
  -> `vector persistence`

### 6-2. 질의 파이프라인

### 확실한 내용

- 질의는 먼저 Chroma 검색을 통해 근거 문서를 회수한다.  
  근거: [src/rag/query/query.service.ts](../src/rag/query/query.service.ts)

- 검색 결과는 citation 과 retrieved 형태로 정리된다.  
  근거: [src/rag/query/query.service.ts](../src/rag/query/query.service.ts)

- 그 뒤 Ollama chat model 에 근거 컨텍스트를 전달해 응답을 생성한다.  
  근거: [src/rag/query/query.service.ts](../src/rag/query/query.service.ts), [src/rag/llm/ollama.service.ts](../src/rag/llm/ollama.service.ts)

- 따라서 이 구조는 "검색 후 생성" 인 전형적인 RAG 파이프라인이다.  
  근거: [src/rag/query/query.service.ts](../src/rag/query/query.service.ts), [README.md](../README.md)

### 데이터 흐름 그래프

- `question`
  -> `vector search`
  -> `retrieved context`
  -> `prompt composition`
  -> `LLM generation`
  -> `grounded response`

## 7. 외부 시스템 경계

### 확실한 내용

- `Chroma` 는 별도 프로세스/컨테이너로 분리되어 있다.  
  근거: [docker-compose.yml](../docker-compose.yml)

- `Ollama` 도 별도 프로세스/컨테이너로 분리되어 있다.  
  근거: [docker-compose.yml](../docker-compose.yml)

- API 서버는 환경변수로 두 외부 시스템의 URL 을 주입받는다.  
  근거: [docker-compose.yml](../docker-compose.yml), [.env.example](../.env.example), [src/rag/shared/constants.ts](../src/rag/shared/constants.ts)

- `Chroma` 와 `Ollama` 는 각각 독립 healthcheck 를 가진다.  
  근거: [docker-compose.yml](../docker-compose.yml)

### 경계 해석

- API 서버는 상태를 가지는 저장 계층을 직접 소유하지 않는다.
- 지속성은 Chroma 컬렉션과 로컬 업로드 디렉토리 두 군데에 분산된다.
- 이 때문에 애플리케이션 재시작과 벡터 데이터 보존은 서로 다른 문제로 다뤄야 한다.

## 8. 배포 구조

### 확실한 내용

- `docker-compose.yml` 기준 런타임 구성은 다음과 같다.
  - `chroma`
  - `ollama`
  - 선택적 `api`  
  근거: [docker-compose.yml](../docker-compose.yml)

- `api` 컨테이너는 `chroma`, `ollama` 의 healthcheck 성공 이후에 의존적으로 기동된다.  
  근거: [docker-compose.yml](../docker-compose.yml)

- `api` 컨테이너는 `./data` 를 `/app/data` 로 마운트한다.  
  근거: [docker-compose.yml](../docker-compose.yml)

- `chroma` 와 `ollama` 는 named volume 으로 상태를 유지한다.  
  근거: [docker-compose.yml](../docker-compose.yml)

### 텍스트 배포 다이어그램

- `host`
  -> `rag-api`
  -> `rag-chroma`
  -> `rag-ollama`

- `rag-api`
  -> mount `./data`

- `rag-chroma`
  -> volume `rag_chroma_data`

- `rag-ollama`
  -> volume `rag_ollama_data`

## 9. 장애 전파 구조

### 확실한 내용

- `Ollama` 장애는 다음 기능에 영향을 준다.
  - embeddings 생성
  - chat generation
  - healthcheck  
  근거: [src/rag/llm/ollama.service.ts](../src/rag/llm/ollama.service.ts), [src/rag/chroma/chroma.service.ts](../src/rag/chroma/chroma.service.ts), [src/rag/health/health.service.ts](../src/rag/health/health.service.ts)

- `Chroma` 장애는 다음 기능에 영향을 준다.
  - document ingest
  - similarity search
  - healthcheck  
  근거: [src/rag/chroma/chroma.service.ts](../src/rag/chroma/chroma.service.ts), [src/rag/health/health.service.ts](../src/rag/health/health.service.ts)

- 파일 추출 실패는 전체 요청이 아니라 파일별 실패 결과로 격리된다.  
  근거: [src/rag/ingest/ingest.controller.ts](../src/rag/ingest/ingest.controller.ts), [src/rag/ingest/services/ingest.service.ts](../src/rag/ingest/services/ingest.service.ts)

### 아키텍처 해석

- 파일 단위 실패 격리는 인덱싱 파이프라인의 결합도를 낮추는 장치다.
- 반면 `Chroma` 와 `Ollama` 는 각각 단일 외부 의존점이므로 현재 구조는 이중화보다는 단순성에 치우쳐 있다.

## 10. 확장 포인트

### 추정 내용

- 새 파일 형식을 추가하려면 `TextExtractorService` 가 가장 직접적인 확장 지점이다.  
  근거: [src/rag/ingest/services/text-extractor.service.ts](../src/rag/ingest/services/text-extractor.service.ts)

- 검색 전략이나 메타데이터 필터 전략을 바꾸려면 `ChromaService` 와 `QueryService` 가 핵심 변경 지점이 된다.  
  근거: [src/rag/chroma/chroma.service.ts](../src/rag/chroma/chroma.service.ts), [src/rag/query/query.service.ts](../src/rag/query/query.service.ts)

- 프롬프트 정책이나 응답 형식을 바꾸려면 `QueryService.generateGroundedAnswer()` 가 핵심 변경 지점이다.  
  근거: [src/rag/query/query.service.ts](../src/rag/query/query.service.ts)

- 다른 모델 제공자로 교체하려면 `OllamaService` 를 교체 가능한 어댑터 경계로 보는 것이 가장 자연스럽다.  
  근거: [src/rag/llm/ollama.service.ts](../src/rag/llm/ollama.service.ts)

## 11. 추천 읽기 순서

- 시스템 전체 구조를 먼저 볼 때  
  `src/main.ts -> src/app.module.ts -> src/rag/rag.module.ts -> docker-compose.yml`

- 인프라 경계를 볼 때  
  `src/rag/chroma/chroma.service.ts -> src/rag/llm/ollama.service.ts -> src/rag/shared/constants.ts -> docker-compose.yml`

- 인덱싱 아키텍처를 볼 때  
  `src/rag/ingest/ingest.module.ts -> src/rag/ingest/ingest.controller.ts -> src/rag/ingest/services/ingest.service.ts -> src/rag/ingest/services/text-extractor.service.ts -> src/rag/ingest/services/chunking.service.ts`

- 질의 아키텍처를 볼 때  
  `src/rag/query/query.module.ts -> src/rag/query/query.controller.ts -> src/rag/query/query.service.ts -> src/rag/chroma/chroma.service.ts -> src/rag/llm/ollama.service.ts`
