# Worklog: Test And Runtime Check

## 1. 작업 일시

- 수행 일시: 2026-03-16 21:28:13 +09:00

## 2. 선행 확인 문서

`docs/DOCS_READING_ORDER.md` 기준으로 아래 문서를 순서대로 확인했다.

1. `docs/REPOSITORY_MAP.md`
2. `docs/ARCHITECTURE.md`
3. `docs/MESSAGE_FLOW.md`
4. `docs/DATA_CONTRACT.md`
5. `docs/DEVELOPMENT_GUIDE.md`
6. `docs/TROUBLESHOOTING.md`

## 3. 이번 작업 목표

- MVP 핵심 기능인 문서 업로드와 문서 기반 응답 생성 흐름에 대한 테스트 보강
- 실제 앱 부팅 가능 여부 확인
- 확인 결과를 문서화

## 3-1. 이번 단계의 테스트 전략

- `README.md` 기준 실행 계획은 `docker-compose` 로 `Chroma`, `Ollama` 를 준비한 뒤 앱을 실행하는 방식이다.
- 다만 이번 단계는 MVP 초기 안정화 목적이므로, 외부 서비스까지 붙이는 시스템 e2e보다 유닛 테스트 기반 검증을 우선했다.
- 따라서 `Ollama`, `Chroma` 같은 외부 의존성은 테스트에서 모킹으로 대체했다.
- 현재 문서의 `test:e2e` 는 엄밀한 의미의 인프라 포함 e2e가 아니라, `AppModule` 조립과 전역 검증/예외 규약을 확인하는 통합 테스트 성격이다.
- 실제 `docker compose` 기반 검증은 다음 단계의 시스템 e2e로 분리하는 것이 맞다.

## 4. 변경 내용

### 테스트 보강

- `src/rag/ingest/services/ingest.service.spec.ts`
  - 인라인 텍스트 적재 성공
  - 공백 텍스트 거부
  - 지원하지 않는 확장자 실패
  - 텍스트 추출 결과가 비어 있을 때 실패
  - 파일 적재 시 메타데이터 전달 확인
  - 비원시값 메타데이터 직렬화 확인

- `src/rag/health/health.service.spec.ts`
  - Chroma/Ollama 둘 다 정상일 때 `ok`
  - 하나라도 실패할 때 `degraded`

- `test/app.e2e-spec.ts`
  - `AppModule` 기준 통합 테스트로 재구성
  - 외부 서비스는 모킹으로 대체
  - 전역 `ValidationPipe` 규칙 검증
  - 전역 `HttpExceptionFilter` 응답 포맷 검증
  - `HealthController`, `IngestController` 조립 결과 검증

### 런타임 응답 포맷 수정

- `src/common/filters/http-exception.filter.ts`
  - 상태 코드별 기본 `error` 라벨을 동적으로 생성하도록 수정
  - 실제 `/health` 503 응답에서 `Internal Server Error`가 내려가던 문제를 `Service Unavailable`로 수정

## 5. 실행 결과

### 테스트 결과 요약

| 구분 | 명령어 | 결과 | 비고 |
|---|---|---|---|
| Unit | `npm test -- --runInBand` | PASS | 외부 서비스 모킹 기반 |
| Integration | `npm run test:e2e -- --runInBand` | PASS | `AppModule` 조립/검증/예외 포맷 확인 |
| Runtime Boot | `npm run start` + `/docs` 확인 | PASS | 앱 부팅 및 Swagger 응답 확인 |
| System E2E | `npm run test:system-e2e` | PASS | `health -> ingest/text -> ingest/files -> query` 실제 흐름 완료 |

### 단위 테스트

- 실행 명령어: `npm test -- --runInBand`
- 결과: `PASS`
- 통과 스위트: 4
- 통과 테스트: 12

### 통합 테스트(`test:e2e`)

- 실행 명령어: `npm run test:e2e -- --runInBand`
- 결과: `PASS`
- 통과 스위트: 1
- 통과 테스트: 5

### 시스템 e2e

- 실행 명령어: `npm run test:system-e2e`
- 결과: `PASS`
- 실제 확인 순서
  - `GET /health`
  - `POST /ingest/text`
  - `POST /ingest/files`
  - `POST /query`
- 해석
  - 현재 저장소 기준 실제 문서 적재와 근거 기반 질의 응답 흐름이 끝까지 완료됐다.
  - 최소 완료 기준이었던 `answer`, `citations`, `retrieved` 유효성도 함께 확인했다.

## 6. 실제 구동 확인 결과

### 앱 부팅

- 실행 명령어: `npm run start`
- 결과:
  - Nest 애플리케이션 부팅 성공
  - 라우트 매핑 확인
    - `POST /ingest/text`
    - `POST /ingest/files`
    - `POST /query`
    - `GET /health`

### Swagger 확인

- 확인 명령어: `curl -i -sS http://127.0.0.1:3000/docs`
- 결과: `HTTP/1.1 200 OK`
- 해석: 앱 자체 부팅과 HTTP 응답은 정상

### 외부 의존성 확인

- 확인 명령어: `curl -sS http://127.0.0.1:8000/api/v1/heartbeat`
- 결과: 연결 실패

- 확인 명령어: `curl -sS http://127.0.0.1:11434/api/tags`
- 결과: 연결 실패

### 종합 해석

- Nest 앱 자체는 정상 부팅된다.
- 현재 환경에서는 `Chroma` 와 `Ollama` 가 떠 있지 않아 `/health` 는 정상적으로 `503`을 반환하는 상태다.
- 따라서 현재 확인된 실행 리스크는 앱 코드보다는 외부 의존성 미기동에 가깝다.

## 7. 이번 작업으로 확인된 이슈

## [INCIDENT-20260316-001] 503 응답의 error 라벨 오표기

### 1. 요약
- 장애 유형: `Application`
- 발생 일시: 2026-03-16
- 발견 경로: 실제 앱 부팅 후 `/health` 확인
- 심각도: 낮음

### 2. 증상
- `/health` 가 503일 때 `details.error` 가 `Internal Server Error` 로 내려갔다.

### 3. 원인 분석
- `HttpExceptionFilter` 가 상태 코드별 기본 error 라벨을 쓰지 않고 고정 문자열을 기본값으로 두고 있었다.

### 4. 해결 방법
- 상태 코드에서 기본 라벨을 계산하도록 필터 수정

### 5. 검증 결과
- 통합 테스트에서 `ServiceUnavailableException` 포맷 검증 추가 후 통과

## [INCIDENT-20260316-002] 실제 e2e에서 Ollama 임베딩 호출 실패

### 1. 요약
- 장애 유형: `External Dependency`
- 발생 일시: 2026-03-16
- 발견 경로: `docker compose` 기반 실제 e2e 수행 중 `POST /ingest/text`
- 심각도: 중간

### 2. 증상
- `docker compose up -d chroma ollama` 후 `GET /health` 는 `200`으로 통과했다.
- 하지만 실제 적재 요청 후 응답이 완료되지 않고 지연됐다.
- API 로그에는 `Getting text from response`가 반복되었다.

### 3. 관측 근거
- `docker compose logs ollama` 확인 결과 `POST /api/embed` 요청이 반복적으로 `404`를 반환했다.
- 현재 `docker-compose.yml`의 Ollama 이미지는 `ollama/ollama:0.1.47` 이었다.
- 현재 앱은 `@langchain/ollama`의 `OllamaEmbeddings`를 사용한다.
- 로컬 패키지 코드 확인 결과 해당 SDK는 임베딩 시 `client.embed()`를 사용한다.

### 4. 원인 분석
- 앱 SDK가 기대하는 Ollama 임베딩 엔드포인트와 컨테이너 버전이 맞지 않았다.
- 즉, 현재 e2e 실패는 애플리케이션 비즈니스 로직 문제가 아니라 Ollama 서버 버전 호환성 문제다.

### 5. 해결 방법
- `docker-compose.yml`의 Ollama 이미지를 `ollama/ollama:0.13.3` 으로 상향 조정했다.
- 이후 새 이미지를 pull 하고 컨테이너를 재생성한 뒤 e2e를 재실행해야 한다.

### 6. 현재 상태
- Compose 파일 수정 완료
- 새 Ollama 이미지 적용 완료
- 실제 적재/질의 e2e 재검증까지 완료

## [INCIDENT-20260316-003] Chroma SDK와 서버 API 버전 불일치로 실제 적재 실패

### 1. 요약
- 장애 유형: `External Dependency`
- 발생 일시: 2026-03-16
- 발견 경로: `npm run test:system-e2e` 의 `POST /ingest/text`
- 심각도: 중간

### 2. 증상
- `/health` 는 `200` 이지만 `POST /ingest/text` 가 `500` 으로 실패했다.

### 3. 관측 근거
- 로컬 재현 코드에서 `Chroma getOrCreateCollection error: ChromaNotFoundError` 확인
- Chroma 컨테이너 로그에서 `POST /api/v2/tenants/default_tenant/databases/default_database/collections` 가 `404`
- 서버 OpenAPI 확인 결과 현재 컨테이너는 `/api/v1/collections` 계열 엔드포인트를 제공

### 4. 원인 분석
- `@langchain/community` 의 현재 Chroma 래퍼가 `chromadb` SDK를 통해 `/api/v2/...` 경로를 사용했다.
- 반면 현재 실행 중인 `chromadb/chroma:0.5.5` 는 컬렉션 생성과 질의에 v1 HTTP API를 제공한다.
- 즉, heartbeat 는 통과하지만 실제 적재/검색 경로에서만 버전 불일치가 터지는 상태였다.

### 5. 해결 방법
- `src/rag/chroma/chroma.service.ts` 를 Chroma v1 HTTP API 직접 호출 방식으로 교체했다.
- 컬렉션 생성/재사용, upsert, query 를 모두 v1 기준으로 처리하도록 변경했다.
- `src/rag/chroma/chroma.service.spec.ts` 로 v1 요청 형식을 검증하는 테스트를 추가했다.

### 6. 검증 결과
- `npm test -- --runInBand src/rag/chroma/chroma.service.spec.ts src/rag/query/query.service.spec.ts src/rag/ingest/services/ingest.service.spec.ts` 통과
- `npm run test:e2e -- --runInBand` 통과
- `npm run test:system-e2e` 통과

## 8. 실패 시 원인과 해결 방법

### 8-1. `test:e2e` 실행이 `listen EPERM` 으로 실패하는 경우

### 실패 이유

- 현재 실행 환경에서 포트 바인딩이 제한되면 `supertest` 기반 e2e가 내부적으로 임시 포트를 열지 못할 수 있다.
- 이 경우는 애플리케이션 로직 실패가 아니라 테스트 인프라 또는 sandbox 제약에 가깝다.

### 해결 방법

- 포트 바인딩이 가능한 로컬 환경에서 다시 실행한다.
- 바인딩 제약이 있는 환경에서는 이번 작업처럼 `AppModule` 조립 검증 + `ValidationPipe` + `HttpExceptionFilter` 통합 테스트로 대체한다.
- 장애 기록 시 분류는 `Test Infrastructure` 또는 `Environment` 로 남긴다.

### 8-2. `/health` 가 `503` 으로 실패하는 경우

### 실패 이유

- `Chroma` 미기동
- `Ollama` 미기동
- `CHROMA_URL`, `OLLAMA_BASE_URL` 오설정

### 해결 방법

- `docker compose up -d` 로 의존 서비스를 먼저 올린다.
- 아래 heartbeat 로 서비스 상태를 먼저 확인한다.

```bash
curl http://127.0.0.1:8000/api/v1/heartbeat
curl http://127.0.0.1:11434/api/tags
```

- 둘 다 응답하면 `GET /health` 를 다시 확인한다.

### 8-3. `/ingest/files` 에서 개별 파일이 `failed` 로 내려오는 경우

### 실패 이유

- 지원하지 않는 확장자
- 추출 결과가 빈 문서
- 스캔 기반 PDF처럼 MVP 범위 밖의 파일

### 해결 방법

- `.pdf`, `.docx`, `.pptx`, `.txt`, `.md` 지원 형식만 사용한다.
- OCR 없는 스캔 파일은 텍스트 기반 문서로 바꿔 다시 업로드한다.
- 필요 시 추출기 확장 또는 OCR 도입을 별도 작업으로 분리한다.

### 8-4. `/query` 응답이 기대와 다르거나 `근거 부족` 인 경우

### 실패 이유

- 문서가 아직 적재되지 않음
- 적재는 됐지만 필터 조건이 너무 좁음
- 외부 의존성 장애로 similarity search 또는 LLM 호출이 정상 수행되지 않음

### 해결 방법

- 먼저 `POST /ingest/text` 또는 `POST /ingest/files` 성공 여부를 확인한다.
- `filters` 없이 재질의해서 검색 범위를 넓힌다.
- `Chroma`, `Ollama` heartbeat 와 모델 상태를 먼저 확인한다.

### 8-5. 실제 e2e에서 적재 요청이 오래 걸리거나 멈추는 경우

### 실패 이유

- Ollama 모델 로딩 지연
- Ollama 모델 미다운로드
- Ollama 서버 버전이 앱 SDK와 맞지 않아 임베딩 API가 실패

### 해결 방법

- `docker compose logs ollama` 로 `/api/embed` 또는 모델 관련 에러를 먼저 확인한다.
- 모델이 없으면 README 절차대로 `llama3:8b`, `nomic-embed-text` 를 pull 한다.
- Ollama 버전이 오래된 경우 현재 앱 SDK와 호환되는 최신 계열로 올린 뒤 다시 시도한다.

## 9. 남은 확인 항목

- 현재 우선순위
  - 시스템 e2e를 CI 또는 스크립트 자동화 흐름으로 더 고정
  - 외부 의존성 버전 정책을 README와 compose 기준으로 계속 동기화

- 다음 단계
  - `test:system-e2e` 를 CI 또는 별도 검증 파이프라인에 연결
  - Docker/외부 의존성 버전 호환성 문서를 실제 운영 절차 기준으로 정리
  - `POST /ingest/text` 실제 적재 성공 여부
  - 샘플 문서 파일 업로드 후 `POST /query` 응답 품질
