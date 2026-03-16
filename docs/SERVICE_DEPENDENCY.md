# Service Dependency

## 1. 문서 목적

이 문서는 현재 프로젝트의 서비스 간 의존 관계와 연결 방식을 빠르게 파악하기 위한 문서다.  
서비스 책임 설명보다 다음을 우선 정리한다.

- 어떤 서비스가 누구를 호출하는지
- `(방식: HTTP/Module Dependency/File System)` 중 어떤 방식으로 연결되는지
- 어떤 관계가 코드 근거로 확실한지
- 어떤 관계가 추정인지
- 어떤 관계가 아직 확인이 필요한지

현재 저장소는 멀티 서비스 모노레포가 아니라 단일 NestJS RAG API 프로젝트다. 따라서 이 문서의 기준 노드는 `api-server`, `chroma`, `ollama` 와 API 내부 모듈들이다.  
근거: [docs/REPOSITORY_MAP.md](./REPOSITORY_MAP.md), [docs/ARCHITECTURE.md](./ARCHITECTURE.md)

## 2. 분석 대상 서비스

### 내부 서비스

- `api-server`

### 외부 시스템

- `chroma`
- `ollama`

### 내부 모듈

- `ingest`
- `query`
- `health`
- `vector-store`
- `chroma-module`
- `llm-module`

## 3. 의존 관계 요약

### 확실한 내용

- `api-server -> chroma (방식: HTTP)`  
  근거: [src/rag/chroma/chroma.service.ts](../src/rag/chroma/chroma.service.ts), [docker-compose.yml](../docker-compose.yml)

- `api-server -> ollama (방식: HTTP)`  
  근거: [src/rag/llm/ollama.service.ts](../src/rag/llm/ollama.service.ts), [docker-compose.yml](../docker-compose.yml)

- `ingest -> vector-store (방식: Module Dependency)`  
  근거: [src/rag/ingest/ingest.module.ts](../src/rag/ingest/ingest.module.ts)

- `query -> vector-store (방식: Module Dependency)`  
  근거: [src/rag/query/query.module.ts](../src/rag/query/query.module.ts)

- `query -> llm-module (방식: Module Dependency)`  
  근거: [src/rag/query/query.module.ts](../src/rag/query/query.module.ts)

- `health -> vector-store (방식: Module Dependency)`  
  근거: [src/rag/health/health.module.ts](../src/rag/health/health.module.ts)

- `health -> llm-module (방식: Module Dependency)`  
  근거: [src/rag/health/health.module.ts](../src/rag/health/health.module.ts)

- `vector-store -> chroma-module (방식: Module Dependency)`  
  근거: [src/rag/vector-store/vector-store.module.ts](../src/rag/vector-store/vector-store.module.ts)

- `chroma-module -> llm-module (방식: Module Dependency)`  
  근거: [src/rag/chroma/chroma.module.ts](../src/rag/chroma/chroma.module.ts)

- `api-server -> data/uploads (방식: File System)`  
  근거: [src/rag/ingest/ingest.controller.ts](../src/rag/ingest/ingest.controller.ts)

### 추정 내용

- 현재 구조는 별도 백엔드 서비스 간 통신이 아니라, 하나의 `api-server` 가 외부 AI/벡터 저장소에 의존하는 구조로 운영되는 것으로 보인다.  
  근거: [src/app.module.ts](../src/app.module.ts), [src/rag/rag.module.ts](../src/rag/rag.module.ts), [docker-compose.yml](../docker-compose.yml)

- `query` 와 `health` 가 모두 `llm-module` 과 `vector-store` 에 의존하는 구조상, 검색 계층과 생성 계층이 API 내부 공통 인프라로 묶여 있다고 볼 수 있다.  
  근거: [src/rag/query/query.module.ts](../src/rag/query/query.module.ts), [src/rag/health/health.module.ts](../src/rag/health/health.module.ts)

### 확인 필요 사항

- 향후 `api-server` 를 별도 인덱싱 서버와 질의 서버로 분리할 계획이 있는지
- `data/uploads` 를 계속 로컬 파일시스템으로 유지할지, 외부 스토리지로 옮길지

## 4. 서비스별 outbound dependency

### api-server

- 호출 대상
  - `chroma`
  - `ollama`
  - `data/uploads`
- 연결 방식
  - `(방식: HTTP)` to `chroma`
  - `(방식: HTTP)` to `ollama`
  - `(방식: File System)` to `data/uploads`
- 근거
  - [src/rag/chroma/chroma.service.ts](../src/rag/chroma/chroma.service.ts)
  - [src/rag/llm/ollama.service.ts](../src/rag/llm/ollama.service.ts)
  - [src/rag/ingest/ingest.controller.ts](../src/rag/ingest/ingest.controller.ts)
  - [docker-compose.yml](../docker-compose.yml)

### chroma

- 호출 대상
  - 없음
- 연결 방식
  - 수신 전용 `(방식: HTTP)`
- 근거
  - [src/rag/chroma/chroma.service.ts](../src/rag/chroma/chroma.service.ts)

### ollama

- 호출 대상
  - 없음
- 연결 방식
  - 수신 전용 `(방식: HTTP)`
- 근거
  - [src/rag/llm/ollama.service.ts](../src/rag/llm/ollama.service.ts)

## 5. 모듈별 outbound dependency

### ingest

- 호출 대상
  - `vector-store`
  - `data/uploads`
  - 내부 `TextExtractorService`
  - 내부 `ChunkingService`
- 연결 방식
  - `(방식: Module Dependency)` to `vector-store`
  - `(방식: File System)` to `data/uploads`
- 근거
  - [src/rag/ingest/ingest.module.ts](../src/rag/ingest/ingest.module.ts)
  - [src/rag/ingest/ingest.controller.ts](../src/rag/ingest/ingest.controller.ts)
  - [src/rag/ingest/services/ingest.service.ts](../src/rag/ingest/services/ingest.service.ts)

### query

- 호출 대상
  - `vector-store`
  - `llm-module`
- 연결 방식
  - `(방식: Module Dependency)`
- 근거
  - [src/rag/query/query.module.ts](../src/rag/query/query.module.ts)
  - [src/rag/query/query.service.ts](../src/rag/query/query.service.ts)

### health

- 호출 대상
  - `vector-store`
  - `llm-module`
- 연결 방식
  - `(방식: Module Dependency)`
- 근거
  - [src/rag/health/health.module.ts](../src/rag/health/health.module.ts)
  - [src/rag/health/health.service.ts](../src/rag/health/health.service.ts)

### vector-store

- 호출 대상
  - `chroma-module`
- 연결 방식
  - `(방식: Module Dependency)`
- 근거
  - [src/rag/vector-store/vector-store.module.ts](../src/rag/vector-store/vector-store.module.ts)

### chroma-module

- 호출 대상
  - `llm-module`
  - 외부 `chroma`
  - 외부 `ollama`
- 연결 방식
  - `(방식: Module Dependency)` to `llm-module`
  - `(방식: HTTP)` to `chroma`
  - `(방식: HTTP)` to `ollama` via embeddings
- 근거
  - [src/rag/chroma/chroma.module.ts](../src/rag/chroma/chroma.module.ts)
  - [src/rag/chroma/chroma.service.ts](../src/rag/chroma/chroma.service.ts)

### llm-module

- 호출 대상
  - 외부 `ollama`
- 연결 방식
  - `(방식: HTTP)`
- 근거
  - [src/rag/llm/llm.module.ts](../src/rag/llm/llm.module.ts)
  - [src/rag/llm/ollama.service.ts](../src/rag/llm/ollama.service.ts)

## 6. HTTP 호출 관계

### 확실한 내용

- `api-server -> chroma (방식: HTTP)`
  - heartbeat: `/api/v1/heartbeat`
  - vector store add/search 요청
  - 근거: [src/rag/chroma/chroma.service.ts](../src/rag/chroma/chroma.service.ts)

- `api-server -> ollama (방식: HTTP)`
  - heartbeat: `/api/tags`
  - embeddings 생성
  - chat model 호출
  - 근거: [src/rag/llm/ollama.service.ts](../src/rag/llm/ollama.service.ts), [src/rag/query/query.service.ts](../src/rag/query/query.service.ts)

### 확인 필요 사항

- 없음

## 7. 메시징 관계

### Kafka

- 현재 코드 기준 Kafka 의존 없음
- 관련 코드 위치 없음

### RabbitMQ

- 현재 코드 기준 RabbitMQ 의존 없음
- 관련 코드 위치 없음

### WebSocket

- 현재 코드 기준 WebSocket 의존 없음
- 관련 코드 위치 없음

## 8. 공통 모듈 의존 관계

### 현재 저장소 기준

- `ingest`, `query`, `health` 는 각각 직접 외부 시스템을 다루지 않고 공통 인프라 모듈을 통해 접근한다.
- `vector-store` 는 `chroma-module` 을 감싸는 얇은 공통 진입점이다.
- `llm-module` 은 Ollama 연결을 공통화한다.

근거:
- [src/rag/ingest/ingest.module.ts](../src/rag/ingest/ingest.module.ts)
- [src/rag/query/query.module.ts](../src/rag/query/query.module.ts)
- [src/rag/health/health.module.ts](../src/rag/health/health.module.ts)
- [src/rag/vector-store/vector-store.module.ts](../src/rag/vector-store/vector-store.module.ts)
- [src/rag/llm/llm.module.ts](../src/rag/llm/llm.module.ts)

### shared package 관점

- 현재 저장소에는 `packages/common` 이 없다.
- 대신 공통 코드는 `src/common`, `src/rag/shared`, `llm-module`, `chroma-module`, `vector-store` 에 분산되어 있다.

근거:
- [src/common/filters/http-exception.filter.ts](../src/common/filters/http-exception.filter.ts)
- [src/rag/shared/constants.ts](../src/rag/shared/constants.ts)

## 9. 추천 의존 관계 그래프

- `client -> api-server (방식: HTTP)`
- `api-server -> ingest (방식: Module Dependency)`
- `api-server -> query (방식: Module Dependency)`
- `api-server -> health (방식: Module Dependency)`
- `ingest -> vector-store (방식: Module Dependency)`
- `query -> vector-store (방식: Module Dependency)`
- `query -> llm-module (방식: Module Dependency)`
- `health -> vector-store (방식: Module Dependency)`
- `health -> llm-module (방식: Module Dependency)`
- `vector-store -> chroma-module (방식: Module Dependency)`
- `chroma-module -> llm-module (방식: Module Dependency)`
- `api-server -> chroma (방식: HTTP)`
- `api-server -> ollama (방식: HTTP)`
- `api-server -> data/uploads (방식: File System)`

## 10. 확인 필요 항목

- 향후 인덱싱/질의 기능을 별도 서버로 분리할 계획이 있는지
- 공통 인프라 코드를 `packages` 형태로 분리할 계획이 있는지
- 업로드 파일 저장소를 로컬 디스크에서 외부 스토리지로 변경할 계획이 있는지
