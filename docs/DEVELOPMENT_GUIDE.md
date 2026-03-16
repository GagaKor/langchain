# Development Guide

## 1. 문서 목적

이 문서는 신규 기능과 신규 서비스 추가 시 일관된 구조로 코드를 작성하기 위한 개발 규칙 문서다.  
목표는 다음과 같다.

- 디렉토리 구조를 임의로 흔들지 않기
- Controller, Module, Service 역할을 분명히 유지하기
- 공통 코드를 한 곳에 모아 중복을 줄이기
- 이후 서비스가 늘어나도 같은 규칙으로 확장 가능하게 만들기

현재 저장소는 `apps/`, `packages/` 모노레포가 아니라 단일 NestJS 프로젝트다. 따라서 실제 적용 규칙은 `src/` 기준으로 정의한다. 다만 향후 멀티 서비스 구조로 확장할 경우를 대비해 `apps`, `packages` 기준 권장 규칙도 함께 정리한다.  
근거: [docs/REPOSITORY_MAP.md](./REPOSITORY_MAP.md), [src/app.module.ts](../src/app.module.ts), [src/rag/rag.module.ts](../src/rag/rag.module.ts)

## 2. 기본 원칙

- NestJS 구조를 유지한다.
- 기능 단위로 모듈을 나눈다.
- `Controller -> Service -> External Adapter` 방향 의존을 유지한다.
- DTO 없이 요청 바디를 직접 받지 않는다.
- 공통 규칙과 공통 상수는 흩어놓지 않는다.
- 외부 시스템 연동 코드는 Controller 안에 두지 않는다.
- 예외 포맷은 전역 필터 규칙을 따른다.

근거: [src/main.ts](../src/main.ts), [src/common/filters/http-exception.filter.ts](../src/common/filters/http-exception.filter.ts), [src/rag/ingest/ingest.controller.ts](../src/rag/ingest/ingest.controller.ts), [src/rag/query/query.service.ts](../src/rag/query/query.service.ts)

## 3. 서비스 추가

### 현재 저장소 기준

현재 저장소는 단일 서버 구조이므로 "신규 서비스 추가"는 보통 다음 두 경우로 나뉜다.

1. 기존 API 서버 안에 신규 도메인 모듈 추가
2. 정말 별도 서버가 필요할 때만 프로젝트를 별도 앱으로 분리

### 신규 도메인 모듈 추가 규칙

1. `src/rag` 아래에 기능 단위 디렉토리를 만든다.
2. 최소 구성은 `*.module.ts`, `*.controller.ts`, `*.service.ts` 로 시작한다.
3. 요청 바디가 있으면 `dto/` 를 만든다.
4. 기능 내부 처리 컴포넌트가 늘어나면 `services/` 로 분리한다.
5. 최상위 `RagModule` 에 새 모듈을 연결한다.

### 권장 예시

```text
src/rag/example
├── dto
│   └── example.dto.ts
├── services
│   └── example-processing.service.ts
├── example.controller.ts
├── example.module.ts
└── example.service.ts
```

### 규칙

- 기능이 하나의 HTTP 진입점과 하나의 핵심 유스케이스로 끝나면 `controller + service + dto` 만 둔다.
- 파일 처리, 검색 처리, 외부 API 호출처럼 내부 역할이 분리되면 `services/` 로 세분화한다.
- 모듈 이름은 기능명 기준으로 짓고, 기술명 기준 이름은 피한다.
- 새 모듈은 `src/rag/rag.module.ts` 에 등록한다.

근거: [src/rag/ingest/ingest.module.ts](../src/rag/ingest/ingest.module.ts), [src/rag/query/query.module.ts](../src/rag/query/query.module.ts), [src/rag/health/health.module.ts](../src/rag/health/health.module.ts), [src/rag/rag.module.ts](../src/rag/rag.module.ts)

### 향후 모노레포 확장 시 권장 규칙

```md
## 서비스 추가

1. `apps` 디렉토리에 서비스 생성
2. NestJS 구조 유지
3. 공통 모듈은 `packages/common` 사용
4. 서버 하나당 앱 디렉토리 하나 유지
5. 서비스 진입점은 `main.ts`, `app.module.ts` 로 통일
```

이 규칙은 향후 `apps/*`, `packages/*` 구조로 확장할 때 적용한다. 현재 저장소에는 직접 적용되지 않는다.

## 4. Controller 작성 규칙

### 역할

- Controller 는 HTTP 진입점만 담당한다.
- 요청 파라미터 수집, DTO 검증 완료 후 Service 호출까지만 담당한다.
- 비즈니스 로직, 외부 API 호출, 긴 데이터 가공은 Controller 에 두지 않는다.

### 작성 규칙

- 각 엔드포인트는 가능한 한 얇게 유지한다.
- 요청 body/query/params 는 DTO 로 선언한다.
- 파일 업로드 같은 transport 관련 로직만 Controller 에 둔다.
- 응답 가공은 최소 수준만 허용한다.
- 반복되는 예외 처리 로직을 Controller 에 중복 작성하지 않는다.

### 좋은 예시

- `IngestController`
  - 업로드 파일을 받고
  - `IngestService` 로 위임하고
  - 결과를 그대로 응답한다.  
  근거: [src/rag/ingest/ingest.controller.ts](../src/rag/ingest/ingest.controller.ts)

- `QueryController`
  - DTO 를 받고
  - `QueryService.query()` 로 위임한다.  
  근거: [src/rag/query/query.controller.ts](../src/rag/query/query.controller.ts)

### 금지 규칙

- Controller 안에서 `fetch`, `axios`, DB 호출 직접 사용 금지
- Controller 안에서 복잡한 분기 처리 금지
- Controller 안에서 메타데이터 생성 로직 구현 금지
- Controller 안에서 벡터 검색/LLM 호출 직접 수행 금지

## 5. Service 작성 규칙

### 역할

- Service 는 실제 유스케이스를 구현한다.
- Controller 에서 받은 입력을 처리하고 필요한 내부 서비스/외부 어댑터를 조합한다.

### 작성 규칙

- 하나의 Service 메서드는 하나의 유스케이스를 중심으로 작성한다.
- 외부 시스템 호출은 별도 어댑터 서비스에 위임한다.
- 내부 변환 로직이 길어지면 별도 processing service 로 분리한다.
- 예외는 의미 있는 레벨에서 발생시키고, 응답 포맷은 전역 필터에 맡긴다.

### 현재 프로젝트 예시

- `IngestService`
  - 입력 검증 보강
  - 메타데이터 생성
  - 추출/청킹/저장 orchestration 담당  
  근거: [src/rag/ingest/services/ingest.service.ts](../src/rag/ingest/services/ingest.service.ts)

- `QueryService`
  - 검색
  - citation 생성
  - 프롬프트 생성
  - LLM 호출 orchestration 담당  
  근거: [src/rag/query/query.service.ts](../src/rag/query/query.service.ts)

## 6. Module 구조 규칙

### 기본 규칙

- 기능 단위로 Module 을 만든다.
- Module 은 해당 기능의 Controller/Provider 조립만 담당한다.
- Module 파일 안에 로직을 넣지 않는다.
- 다른 모듈이 재사용할 기능은 `exports` 로 노출한다.

### 현재 구조에서의 기준

- `RagModule`
  - 기능 모듈 집합의 조립 계층  
  근거: [src/rag/rag.module.ts](../src/rag/rag.module.ts)

- `IngestModule`, `QueryModule`, `HealthModule`
  - 도메인 기능 모듈  
  근거: [src/rag/ingest/ingest.module.ts](../src/rag/ingest/ingest.module.ts), [src/rag/query/query.module.ts](../src/rag/query/query.module.ts), [src/rag/health/health.module.ts](../src/rag/health/health.module.ts)

- `LlmModule`, `ChromaModule`, `VectorStoreModule`
  - 인프라/공통 의존 모듈  
  근거: [src/rag/llm/llm.module.ts](../src/rag/llm/llm.module.ts), [src/rag/chroma/chroma.module.ts](../src/rag/chroma/chroma.module.ts), [src/rag/vector-store/vector-store.module.ts](../src/rag/vector-store/vector-store.module.ts)

### 권장 구조

```text
feature/
├── dto/
├── services/
├── feature.controller.ts
├── feature.service.ts
└── feature.module.ts
```

### 모듈 분리 기준

- 외부 시스템 경계가 다르면 모듈을 분리한다.
- 유스케이스가 다르면 모듈을 분리한다.
- 단순 재사용 목적이면 기능 모듈이 아니라 공통 모듈로 둔다.

## 7. DTO 작성 규칙

- 요청 바디는 DTO 없이 받지 않는다.
- DTO 는 transport contract 만 표현한다.
- DTO 에 비즈니스 로직을 넣지 않는다.
- 검증 규칙은 가능한 DTO 레벨에서 선언한다.
- 날짜, 숫자 변환이 필요한 경우 현재처럼 `ValidationPipe` 의 transform 정책을 활용한다.

### 현재 예시

- `IngestTextDto`
  - `text` 필수, `metadata` 선택  
  근거: [src/rag/ingest/dto/ingest-text.dto.ts](../src/rag/ingest/dto/ingest-text.dto.ts)

- `IngestFilesDto`
  - `project`, `docType`, `createdAt` 정의  
  근거: [src/rag/ingest/dto/ingest-files.dto.ts](../src/rag/ingest/dto/ingest-files.dto.ts)

- `QueryDto`
  - `question`, `topK`, `filters` 정의  
  근거: [src/rag/query/dto/query.dto.ts](../src/rag/query/dto/query.dto.ts)

## 8. Shared Package 사용 규칙

### 현재 저장소 기준

현재 저장소에는 `packages/common` 이 없고, 공통 코드는 다음 위치를 사용한다.

- `src/common`
- `src/rag/shared`
- 공통 인프라 모듈 (`llm`, `chroma`, `vector-store`)

근거: [docs/REPOSITORY_MAP.md](./REPOSITORY_MAP.md), [src/common/filters/http-exception.filter.ts](../src/common/filters/http-exception.filter.ts), [src/rag/shared/constants.ts](../src/rag/shared/constants.ts)

### 현재 프로젝트에서 공통 코드 사용 규칙

- 전역 예외 규칙은 `src/common` 에 둔다.
- 전역 상수, 기본값, 지원 포맷 목록은 `src/rag/shared` 에 둔다.
- 외부 시스템 연결 코드는 기능 모듈이 아니라 공통 인프라 모듈로 둔다.
- 두 개 이상 기능 모듈이 함께 쓰는 코드는 도메인 하위에 중복하지 말고 shared 계층으로 올린다.

### 향후 `packages/common` 도입 시 규칙

```md
## shared package 사용 규칙

1. DTO, 공통 설정, 공통 인프라 코드는 `packages/common` 에 둔다
2. 서비스별 로직은 각 앱 내부에 둔다
3. 공통 패키지에 서비스 특화 로직을 넣지 않는다
4. Kafka/DB/HTTP 같은 횡단 관심사는 shared package 로 모은다
5. shared package 변경 시 의존 서비스 영향을 같이 검토한다
```

### 공통으로 올려야 하는 코드 기준

- 둘 이상의 기능 모듈이 사용하는 상수
- 둘 이상의 기능 모듈이 공유하는 예외 처리 규칙
- 외부 시스템 연결 래퍼
- 공통 DTO 또는 응답 스키마

### 공통으로 올리면 안 되는 코드

- 특정 엔드포인트 전용 로직
- 특정 기능에만 의미 있는 서비스 메서드
- 기능명에 강하게 묶인 프롬프트/비즈니스 규칙

## 9. 파일 배치 규칙

- 새 기능은 기존 도메인 폴더 안에 추가할지, 새 모듈로 뺄지 먼저 판단한다.
- 테스트 파일은 대상 파일과 같은 도메인 아래 또는 `test/` 에 둔다.
- 업로드/실행 산출물은 `src/` 아래에 두지 않는다.
- 환경변수 기본값은 코드와 `.env.example` 둘 다 맞춘다.

## 10. 테스트 작성 규칙

- 신규 Service 를 만들면 최소 단위 테스트를 추가한다.
- 외부 의존 서비스는 mock 으로 대체한다.
- Controller 는 핵심 분기만 테스트하고, 상세 로직 검증은 Service 테스트에 둔다.
- 헬스체크/핵심 엔드포인트는 e2e 또는 통합 테스트 대상에 포함한다.

### 현재 예시

- `HealthController` 단위 테스트 존재  
  근거: [src/rag/health/health.controller.spec.ts](../src/rag/health/health.controller.spec.ts)

- `IngestService`, `QueryService` 단위 테스트 존재  
  근거: [src/rag/ingest/services/ingest.service.spec.ts](../src/rag/ingest/services/ingest.service.spec.ts), [src/rag/query/query.service.spec.ts](../src/rag/query/query.service.spec.ts)

## 11. 신규 기능 추가 체크리스트

### 모듈 추가 전

- 기존 모듈 안에 확장 가능한지 먼저 확인
- 외부 시스템 연결이 필요한지 확인
- 공통 코드로 빼야 할 요소가 있는지 확인

### 구현 중

- DTO 먼저 작성
- Module 생성
- Controller 는 얇게 유지
- Service 에 유스케이스 집중
- 외부 연동은 별도 서비스로 분리

### 구현 후

- `RagModule` 등록 여부 확인
- 테스트 추가 여부 확인
- 환경변수 추가 시 `.env.example` 반영
- 관련 문서 (`ARCHITECTURE`, `MESSAGE_FLOW`, `DATA_CONTRACT`) 업데이트 여부 확인

## 12. 짧은 예시

```md
# Development Guide

## 서비스 추가

1. apps 디렉토리에 서비스 생성
2. NestJS 구조 유지
3. 공통 모듈은 packages/common 사용
```

위 형식은 멀티 서비스 모노레포 기준의 요약형 가이드다.  
현재 저장소에서는 아래처럼 해석해서 적용한다.

```md
## 서비스 추가

1. src/rag 아래에 기능 모듈 생성
2. NestJS 구조 유지
3. 공통 모듈은 src/common, src/rag/shared, 공통 인프라 모듈 사용
```

## 13. 권장 읽기 순서

- 구조 파악  
  `docs/REPOSITORY_MAP.md -> docs/ARCHITECTURE.md -> docs/MESSAGE_FLOW.md`

- 구현 규약 파악  
  `docs/DATA_CONTRACT.md -> src/main.ts -> src/rag/rag.module.ts`

- 유사 구현 참고  
  `src/rag/ingest/* -> src/rag/query/* -> src/rag/health/*`
