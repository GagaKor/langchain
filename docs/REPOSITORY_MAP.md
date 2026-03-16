# Repository Map

이 문서는 AI 에이전트와 개발자가 이 저장소에 빠르게 진입할 수 있도록, 서비스 책임 분석보다 먼저 확인해야 할 디렉토리 구조, 공통 코드 위치, 외부 인프라 연결점, 주요 엔트리포인트를 정리한 구조 탐색용 문서다.

---

## 1. 프로젝트 구조

### 확실한 내용

- 이 저장소는 `apps/`, `packages/`로 나뉜 모노레포가 아니라 루트 `src/` 아래에 단일 NestJS 애플리케이션이 배치된 구조다.  
  근거: [package.json](../package.json), [src/app.module.ts](../src/app.module.ts), [src/main.ts](../src/main.ts)

- 구조 탐색의 핵심 축은 `src/`, `test/`, `data/`, 그리고 루트 실행/배포 파일들(`docker-compose.yml`, `Dockerfile`, `.env.example`)이다.  
  근거: [README.md](../README.md), [docker-compose.yml](../docker-compose.yml), [Dockerfile](../Dockerfile), [.env.example](../.env.example)

- `src/` 아래는 전역 앱 설정을 담당하는 루트 계층과, 실제 RAG 기능을 모아둔 `src/rag`, 공통 예외 필터를 둔 `src/common`으로 나뉜다.  
  근거: [src/app.module.ts](../src/app.module.ts), [src/common/filters/http-exception.filter.ts](../src/common/filters/http-exception.filter.ts), [src/rag/rag.module.ts](../src/rag/rag.module.ts)

- `data/` 아래에는 샘플 문서와 업로드 저장 디렉토리가 존재하며, 업로드 API는 실제로 `data/uploads`를 사용한다.  
  근거: [README.md](../README.md), [src/rag/ingest/ingest.controller.ts](../src/rag/ingest/ingest.controller.ts)

- `test/`는 e2e 테스트 설정을, `src/rag/**.spec.ts`는 모듈 단위 테스트를 담는다.  
  근거: [test/app.e2e-spec.ts](../test/app.e2e-spec.ts), [test/jest-e2e.json](../test/jest-e2e.json), [src/rag/ingest/services/ingest.service.spec.ts](../src/rag/ingest/services/ingest.service.spec.ts), [src/rag/query/query.service.spec.ts](../src/rag/query/query.service.spec.ts)

### 추정 내용

- 현재 저장소는 "문서 인덱싱 + 검색 + LLM 응답"을 하나의 백엔드 프로세스 안에서 처리하고, 벡터 저장소와 모델 서버만 외부 프로세스로 분리한 MVP 구조로 보인다.  
  근거: [README.md](../README.md), [docker-compose.yml](../docker-compose.yml), [src/rag/rag.module.ts](../src/rag/rag.module.ts)

### 확인 필요 사항

- 없음

---

## 2. 서비스 분류

### 확실한 내용

- 애플리케이션 코드 기준 서비스 축은 하나의 NestJS API 서버다. 주요 HTTP 기능은 `health`, `ingest`, `query` 세 도메인으로 나뉜다.  
  근거: [src/rag/health/health.controller.ts](../src/rag/health/health.controller.ts), [src/rag/ingest/ingest.controller.ts](../src/rag/ingest/ingest.controller.ts), [src/rag/query/query.controller.ts](../src/rag/query/query.controller.ts)

- 런타임 인프라 기준으로는 `chroma`, `ollama`, 선택적 `api` 컨테이너가 함께 정의되어 있다.  
  근거: [docker-compose.yml](../docker-compose.yml)

- `health`는 외부 의존성 상태 확인, `ingest`는 텍스트/파일 인덱싱, `query`는 검색 결과 기반 응답 생성을 담당한다.  
  근거: [src/rag/health/health.service.ts](../src/rag/health/health.service.ts), [src/rag/ingest/services/ingest.service.ts](../src/rag/ingest/services/ingest.service.ts), [src/rag/query/query.service.ts](../src/rag/query/query.service.ts)

### 추정 내용

- 기능 분류상 이 저장소는 범용 백엔드가 아니라 RAG API 서버에 집중된 단일 목적 서비스로 운영되도록 설계된 것으로 보인다.  
  근거: [package.json](../package.json), [README.md](../README.md)

### 확인 필요 사항

- API 서버를 로컬 Node 프로세스로만 주로 띄우는지, `docker-compose --profile api` 방식까지 포함해 운영하는지는 추가 확인이 필요하다.

---

## 3. 공통 코드 구조

### 확실한 내용

- 공통 패키지 루트인 `packages/`는 없고, 재사용 코드는 `src/common`과 `src/rag/shared`에 모여 있다.  
  근거: [src/common/filters/http-exception.filter.ts](../src/common/filters/http-exception.filter.ts), [src/rag/shared/constants.ts](../src/rag/shared/constants.ts)

- 전역 공통 처리로 확인되는 코드는 HTTP 예외 응답 포맷을 통일하는 `HttpExceptionFilter`다.  
  근거: [src/common/filters/http-exception.filter.ts](../src/common/filters/http-exception.filter.ts), [src/main.ts](../src/main.ts)

- `src/rag/shared/constants.ts`는 Chroma/Ollama URL, 기본 컬렉션명, 모델명, 청크 크기, 지원 파일 확장자, 추출 실패 메시지 같은 공통 런타임 상수를 정의한다.  
  근거: [src/rag/shared/constants.ts](../src/rag/shared/constants.ts)

- 모듈 간 공통 인프라 의존은 `VectorStoreModule`, `LlmModule`, `ChromaModule`을 통해 재사용된다.  
  근거: [src/rag/vector-store/vector-store.module.ts](../src/rag/vector-store/vector-store.module.ts), [src/rag/llm/llm.module.ts](../src/rag/llm/llm.module.ts), [src/rag/chroma/chroma.module.ts](../src/rag/chroma/chroma.module.ts)

### 추정 내용

- 신규 기능을 분석할 때는 `src/rag/shared/constants.ts`와 `src/common/filters/http-exception.filter.ts`를 먼저 보면 전역 동작 가정과 에러 응답 형태를 빠르게 파악할 수 있다.  
  근거: [src/rag/shared/constants.ts](../src/rag/shared/constants.ts), [src/common/filters/http-exception.filter.ts](../src/common/filters/http-exception.filter.ts)

### 확인 필요 사항

- 현재 공통 코드가 계속 `src/common`과 `src/rag/shared` 정도로 유지될지, 추후 별도 라이브러리 계층으로 분리할 계획인지는 확인이 필요하다.

---

## 4. 인프라 / 모델 / 벡터 저장소 위치

### 확실한 내용

- Chroma 연결 코드는 `src/rag/chroma/chroma.service.ts`에 있으며, heartbeat, 문서 추가, similarity search를 담당한다.  
  근거: [src/rag/chroma/chroma.service.ts](../src/rag/chroma/chroma.service.ts)

- Ollama 연결 코드는 `src/rag/llm/ollama.service.ts`에 있으며, 채팅 모델과 임베딩 모델 생성 및 heartbeat를 담당한다.  
  근거: [src/rag/llm/ollama.service.ts](../src/rag/llm/ollama.service.ts)

- 외부 인프라 정의는 루트 `docker-compose.yml`에 집중되어 있고, Chroma는 `8000`, Ollama는 `11434`, API는 `3000` 포트를 사용한다.  
  근거: [docker-compose.yml](../docker-compose.yml)

- 환경변수 기반 연결 설정은 `.env.example`과 `src/rag/shared/constants.ts`에 반영되어 있다.  
  근거: [.env.example](../.env.example), [src/rag/shared/constants.ts](../src/rag/shared/constants.ts)

- 파일 업로드 인프라는 Nest의 `FilesInterceptor`와 `multer` 디스크 스토리지를 사용하며 업로드 경로는 `data/uploads`다.  
  근거: [src/rag/ingest/ingest.controller.ts](../src/rag/ingest/ingest.controller.ts)

- 텍스트 추출 구현은 `src/rag/ingest/services/text-extractor.service.ts`에 있고, 지원 확장자는 `.pdf`, `.docx`, `.pptx`, `.txt`, `.md`다.  
  근거: [src/rag/ingest/services/text-extractor.service.ts](../src/rag/ingest/services/text-extractor.service.ts), [src/rag/shared/constants.ts](../src/rag/shared/constants.ts)

### 추정 내용

- 현재 인프라 축은 "Nest API + Chroma + Ollama"의 단순한 3계층 구조이며, 별도 메시지 브로커나 관계형 DB는 도입되지 않은 상태로 보인다.  
  근거: [package.json](../package.json), [docker-compose.yml](../docker-compose.yml), [src/rag](../src/rag)

### 확인 필요 사항

- Chroma 컬렉션을 단일 `mvp_docs`로 계속 운영할지, 프로젝트별 컬렉션 분리 전략이 필요한지는 확인이 필요하다.

---

## 5. 핵심 엔트리포인트

### 확실한 내용

- 애플리케이션 부팅 진입점은 `src/main.ts`이며, 여기서 ValidationPipe, 전역 예외 필터, Swagger 문서를 설정한다.  
  근거: [src/main.ts](../src/main.ts)

- 최상위 모듈 진입점은 `src/app.module.ts`이고, 전역 `ConfigModule`과 `RagModule`을 로드한다.  
  근거: [src/app.module.ts](../src/app.module.ts)

- 실제 기능 진입은 `src/rag/rag.module.ts`에서 시작하며, `VectorStoreModule`, `LlmModule`, `IngestModule`, `QueryModule`, `HealthModule`을 조합한다.  
  근거: [src/rag/rag.module.ts](../src/rag/rag.module.ts)

- 인덱싱 축은 `src/rag/ingest/ingest.controller.ts` -> `src/rag/ingest/services/ingest.service.ts` -> `src/rag/ingest/services/text-extractor.service.ts` / `src/rag/ingest/services/chunking.service.ts` -> `src/rag/chroma/chroma.service.ts` 순으로 읽으면 된다.  
  근거: [src/rag/ingest/ingest.controller.ts](../src/rag/ingest/ingest.controller.ts), [src/rag/ingest/services/ingest.service.ts](../src/rag/ingest/services/ingest.service.ts), [src/rag/ingest/services/text-extractor.service.ts](../src/rag/ingest/services/text-extractor.service.ts), [src/rag/ingest/services/chunking.service.ts](../src/rag/ingest/services/chunking.service.ts), [src/rag/chroma/chroma.service.ts](../src/rag/chroma/chroma.service.ts)

- 질의 축은 `src/rag/query/query.controller.ts` -> `src/rag/query/query.service.ts` -> `src/rag/chroma/chroma.service.ts` / `src/rag/llm/ollama.service.ts` 순으로 읽으면 된다.  
  근거: [src/rag/query/query.controller.ts](../src/rag/query/query.controller.ts), [src/rag/query/query.service.ts](../src/rag/query/query.service.ts), [src/rag/chroma/chroma.service.ts](../src/rag/chroma/chroma.service.ts), [src/rag/llm/ollama.service.ts](../src/rag/llm/ollama.service.ts)

- 상태 확인 축은 `src/rag/health/health.controller.ts` -> `src/rag/health/health.service.ts` -> `src/rag/chroma/chroma.service.ts` / `src/rag/llm/ollama.service.ts` 순이다.  
  근거: [src/rag/health/health.controller.ts](../src/rag/health/health.controller.ts), [src/rag/health/health.service.ts](../src/rag/health/health.service.ts), [src/rag/chroma/chroma.service.ts](../src/rag/chroma/chroma.service.ts), [src/rag/llm/ollama.service.ts](../src/rag/llm/ollama.service.ts)

### 추정 내용

- 실제 기능 영향 범위를 빠르게 찾으려면 `src/main.ts` -> `src/app.module.ts` -> `src/rag/rag.module.ts` -> 도메인별 controller/service 순으로 따라가는 것이 가장 효율적이다.  
  근거: [src/main.ts](../src/main.ts), [src/app.module.ts](../src/app.module.ts), [src/rag/rag.module.ts](../src/rag/rag.module.ts)

### 확인 필요 사항

- 없음

---

## 6. 추천 탐색 순서

### 확실한 내용

- 없음

### 추정 내용

- 저장소 구조를 처음 파악할 때는 `README.md` -> `docker-compose.yml` -> `src/main.ts` -> `src/app.module.ts` -> `src/rag/rag.module.ts` 순으로 읽으면 실행 구조와 기능 모듈 구성이 함께 잡힌다.  
  근거: [README.md](../README.md), [docker-compose.yml](../docker-compose.yml), [src/main.ts](../src/main.ts), [src/app.module.ts](../src/app.module.ts), [src/rag/rag.module.ts](../src/rag/rag.module.ts)

- 인덱싱 문제를 볼 때는 `src/rag/ingest/ingest.controller.ts` -> DTO -> `IngestService` -> `TextExtractorService` -> `ChunkingService` -> `ChromaService` 순이 적절하다.  
  근거: [src/rag/ingest/ingest.controller.ts](../src/rag/ingest/ingest.controller.ts), [src/rag/ingest/dto/ingest-files.dto.ts](../src/rag/ingest/dto/ingest-files.dto.ts), [src/rag/ingest/dto/ingest-text.dto.ts](../src/rag/ingest/dto/ingest-text.dto.ts), [src/rag/ingest/services/ingest.service.ts](../src/rag/ingest/services/ingest.service.ts), [src/rag/ingest/services/text-extractor.service.ts](../src/rag/ingest/services/text-extractor.service.ts), [src/rag/ingest/services/chunking.service.ts](../src/rag/ingest/services/chunking.service.ts), [src/rag/chroma/chroma.service.ts](../src/rag/chroma/chroma.service.ts)

- 응답 품질이나 검색 품질을 볼 때는 `src/rag/query/query.service.ts`와 `src/rag/llm/ollama.service.ts`, `src/rag/chroma/chroma.service.ts`를 함께 보는 것이 효율적이다.  
  근거: [src/rag/query/query.service.ts](../src/rag/query/query.service.ts), [src/rag/llm/ollama.service.ts](../src/rag/llm/ollama.service.ts), [src/rag/chroma/chroma.service.ts](../src/rag/chroma/chroma.service.ts)

- 테스트 범위를 확인할 때는 `test/app.e2e-spec.ts`, `src/rag/health/health.controller.spec.ts`, `src/rag/ingest/services/ingest.service.spec.ts`, `src/rag/query/query.service.spec.ts`를 먼저 읽으면 된다.  
  근거: [test/app.e2e-spec.ts](../test/app.e2e-spec.ts), [src/rag/health/health.controller.spec.ts](../src/rag/health/health.controller.spec.ts), [src/rag/ingest/services/ingest.service.spec.ts](../src/rag/ingest/services/ingest.service.spec.ts), [src/rag/query/query.service.spec.ts](../src/rag/query/query.service.spec.ts)

### 확인 필요 사항

- 실제 팀이 장애 대응이나 기능 추가 시 따르는 표준 탐색 순서가 따로 있는지는 확인이 필요하다.

---

## 7. 현재 저장소 해석

### 반영 완료된 내용

- 이 저장소는 모노레포가 아니라 단일 NestJS 기반 RAG API 프로젝트다.
- API의 핵심 기능 축은 `health`, `ingest`, `query` 세 도메인이다.
- 외부 의존 인프라는 Chroma 벡터 저장소와 Ollama 모델 서버다.
- 파일 업로드 결과는 `data/uploads`에 저장되고, 텍스트 추출 뒤 청킹 후 Chroma에 적재된다.
- 질의 시 Chroma 검색 결과를 근거로 Ollama가 한국어 응답을 생성한다.
- Swagger 문서는 `/docs`, 헬스체크는 `/health`, 인덱싱은 `/ingest/text`, `/ingest/files`, 질의는 `/query`에 노출된다.
- 전역 요청 검증과 예외 포맷 통일은 `src/main.ts`와 `src/common/filters/http-exception.filter.ts`에서 처리된다.

### 아직 확인이 필요한 질문

- API 서버의 실제 운영 방식이 로컬 Node 실행 중심인지, 컨테이너 실행까지 포함하는지
- 컬렉션/메타데이터 전략이 MVP 이후에도 단일 컬렉션 중심으로 유지되는지
- 향후 공통 코드를 별도 라이브러리로 분리할 계획이 있는지
