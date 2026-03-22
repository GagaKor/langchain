# Troubleshooting

## 1. 문서 목적

이 문서는 테스트 실행 후 장애를 분석하고, 원인과 해결 내역을 일관된 형식으로 남기기 위한 문서다.  
목적은 다음과 같다.

- 장애를 재현 가능한 형태로 기록
- 원인 분석 과정을 표준화
- 해결 방법과 재발 방지 항목을 남김
- 테스트 결과와 장애를 연결해서 추적 가능하게 유지

이 문서는 "장애 대응 가이드" 이면서 동시에 "장애 보고 템플릿" 으로 사용한다.

## 2. 사용 방법

### 기본 원칙

1. 먼저 테스트를 실행한다.
2. 실패한 테스트 또는 실제 장애 증상을 기록한다.
3. 증상, 원인, 영향 범위, 해결 방법을 분리해서 적는다.
4. 환경 문제인지 코드 문제인지 반드시 구분한다.
5. 해결 후 재검증 결과를 남긴다.

### 권장 절차

1. `npm test -- --runInBand`
2. `npm run test:e2e -- --runInBand`
3. 필요하면 API 수동 호출 또는 health check 수행
4. 아래 장애 보고 템플릿으로 기록

## 3. 현재 확인된 테스트 결과

### 단위 테스트

- 실행 명령어

```bash
npm test -- --runInBand
```

- 결과
  - 최신 기준 통과
  - 상세 기록: `docs/WORKLOG_2026-03-22_RUNTIME_VALIDATION.md`

### e2e 테스트

- 실행 명령어

```bash
npm run test:e2e -- --runInBand
```

- 결과
  - 실행 환경에 따라 `listen EPERM: operation not permitted 0.0.0.0` 가능
  - 이 경우 앱 결함보다 실행 환경 제약일 가능성이 높다.

### 시스템 e2e 테스트

- 실행 명령어

```bash
npm run test:system-e2e
```

- 결과
  - 2026-03-22 기준 실제 환경에서 `PASS`
  - 검증 경로: `/health -> /ingest/text -> /ingest/files -> /ingest/jobs/:jobId -> /query`
  - 상세 기록: `docs/WORKLOG_2026-03-22_RUNTIME_VALIDATION.md`

### 해석

- 단위 테스트는 코드 레벨 검증에 성공했다.
- `test:e2e` 실패는 환경 제약일 수 있으며, 코드 결함으로 바로 단정하면 안 된다.
- 실제 동작 여부는 `test:system-e2e`가 더 신뢰할 수 있는 기준이며, 최신 확인 기준으로는 통과했다.

## 4. 장애 분류 기준

장애를 아래 분류 중 하나 이상으로 태깅한다.

- `Validation`
  - DTO 검증 실패

- `Transport`
  - HTTP 요청 형식, multipart 업로드, 포트 바인딩 문제

- `Application`
  - Service 유스케이스 로직 오류

- `External Dependency`
  - Chroma, Ollama, 파일시스템, 네트워크 문제

- `Environment`
  - 로컬 권한, Docker, GPU, 포트 충돌, sandbox 제약

- `Data`
  - 문서 형식 오류, 텍스트 추출 실패, 메타데이터 문제

- `Test Infrastructure`
  - 테스트 자체가 실행 환경 때문에 실패하는 경우

## 5. 장애 보고 템플릿

아래 템플릿을 복사해서 장애별로 누적 기록한다.

```md
## [INCIDENT-YYYYMMDD-001] 제목

### 1. 요약
- 장애 유형:
- 발생 일시:
- 발견 경로:
- 심각도:

### 2. 증상
- 어떤 현상이 발생했는지
- 사용자/개발자 관점에서 무엇이 보였는지

### 3. 재현 방법
1. 실행 명령어
2. 입력 데이터
3. 기대 결과
4. 실제 결과

### 4. 관측 로그 / 에러 메시지
```text
에러 로그
```

### 5. 영향 범위
- 영향 엔드포인트:
- 영향 모듈:
- 영향 외부 시스템:
- 사용자 영향:

### 6. 원인 분석
- 직접 원인:
- 근본 원인:
- 코드 문제인지 환경 문제인지:

### 7. 해결 방법
- 적용 조치:
- 변경 파일:
- 운영 조치:

### 8. 검증 결과
- 재실행 명령어:
- 결과:

### 9. 재발 방지
- 테스트 보강:
- 문서 보강:
- 코드 구조 개선:
```

## 6. 현재 프로젝트의 대표 장애 유형

### 6-1. DTO 검증 실패

### 증상

- `400 Bad Request`
- `Validation failed`
- `details.errors` 에 필드 오류 목록 포함

### 발생 가능 위치

- `POST /ingest/text`
- `POST /ingest/files`
- `POST /query`

### 주요 원인

- 필수 필드 누락
- 타입 불일치
- `topK` 범위 초과
- `createdAt` 날짜 형식 오류
- DTO 에 없는 필드 포함

### 관련 코드

- [src/main.ts](../src/main.ts)
- [src/rag/ingest/dto/ingest-text.dto.ts](../src/rag/ingest/dto/ingest-text.dto.ts)
- [src/rag/ingest/dto/ingest-files.dto.ts](../src/rag/ingest/dto/ingest-files.dto.ts)
- [src/rag/query/dto/query.dto.ts](../src/rag/query/dto/query.dto.ts)
- [src/common/filters/http-exception.filter.ts](../src/common/filters/http-exception.filter.ts)

### 해결 방법

- DTO 규격에 맞게 요청 수정
- 필요 시 DTO 검증 규칙 업데이트
- 예외 메시지가 부족하면 DTO 설명과 문서 보강

## 6-2. 파일 업로드 / 텍스트 추출 실패

### 증상

- `/ingest/files` 응답의 개별 파일이 `status=failed`
- `reason` 필드에 실패 원인 포함

### 주요 원인

- 지원하지 않는 확장자
- 스캔 PDF 등 텍스트 추출 불가 문서
- 빈 텍스트 추출 결과

### 관련 코드

- [src/rag/ingest/ingest.controller.ts](../src/rag/ingest/ingest.controller.ts)
- [src/rag/ingest/services/ingest.service.ts](../src/rag/ingest/services/ingest.service.ts)
- [src/rag/ingest/services/text-extractor.service.ts](../src/rag/ingest/services/text-extractor.service.ts)
- [src/rag/shared/constants.ts](../src/rag/shared/constants.ts)

### 해결 방법

- 지원 형식인지 먼저 확인
- 문서가 OCR 없는 텍스트 기반 파일인지 확인
- 필요 시 extractor 확장

## 6-3. Chroma 연결 실패

### 증상

- `/health` 가 `503`
- 검색 또는 적재 중 예외 발생

### 주요 원인

- Chroma 서버 미기동
- `CHROMA_URL` 오설정
- 네트워크 또는 컨테이너 상태 문제

### 관련 코드

- [src/rag/chroma/chroma.service.ts](../src/rag/chroma/chroma.service.ts)
- [src/rag/health/health.service.ts](../src/rag/health/health.service.ts)
- [docker-compose.yml](../docker-compose.yml)

### 해결 방법

- Chroma 컨테이너 상태 확인
- heartbeat 확인

```bash
curl http://localhost:8000/api/v1/heartbeat
```

- 환경변수 값 확인

## 6-4. Ollama 연결 실패

### 증상

- `/health` 가 `503`
- 질의 응답 실패
- 인덱싱 중 임베딩 생성 실패

### 주요 원인

- Ollama 서버 미기동
- 모델 미다운로드
- `OLLAMA_BASE_URL` 오설정

### 관련 코드

- [src/rag/llm/ollama.service.ts](../src/rag/llm/ollama.service.ts)
- [src/rag/chroma/chroma.service.ts](../src/rag/chroma/chroma.service.ts)
- [docker-compose.yml](../docker-compose.yml)

### 해결 방법

- Ollama 컨테이너 상태 확인
- 모델 다운로드 여부 확인

```bash
docker exec -it rag-ollama ollama pull llama3:8b
docker exec -it rag-ollama ollama pull nomic-embed-text
```

## 6-5. e2e 테스트 실행 실패

### 증상

- `npm run test:e2e -- --runInBand` 실패
- `listen EPERM: operation not permitted 0.0.0.0`

### 현재 판정

- `Environment` 또는 `Test Infrastructure` 문제로 분류
- 현재 확인 범위에서는 코드 결함으로 단정하지 않음

### 관련 코드

- [test/app.e2e-spec.ts](../test/app.e2e-spec.ts)

### 해결 방향

- 포트 바인딩이 가능한 환경에서 재실행
- 테스트 환경에서 `supertest` 가 bind 없이 동작하도록 설정 검토
- 필요 시 e2e 테스트 실행 전략 수정

## 7. 장애 분석 체크리스트

장애가 발생하면 아래를 순서대로 확인한다.

- 요청 DTO 형식이 맞는가
- 환경변수가 올바른가
- Chroma 가 살아 있는가
- Ollama 가 살아 있는가
- 필요한 모델이 내려받아졌는가
- 업로드 파일 형식이 지원되는가
- 단위 테스트는 통과하는가
- e2e 실패가 코드 문제인지 실행 환경 문제인지 분리했는가
- 에러 응답의 `code/message/details` 를 기록했는가

## 8. 장애 기록 예시

## [INCIDENT-20250316-001] e2e 테스트 포트 바인딩 실패

### 1. 요약

- 장애 유형: `Environment`, `Test Infrastructure`
- 발견 경로: e2e 테스트 실행
- 심각도: 개발 환경 이슈

### 2. 증상

- `npm run test:e2e -- --runInBand` 실행 시 테스트가 시작되지 못하고 종료됨

### 3. 재현 방법

1. 아래 명령 실행

```bash
npm run test:e2e -- --runInBand
```

2. 기대 결과
   - `/health` e2e 테스트 수행

3. 실제 결과
   - `listen EPERM: operation not permitted 0.0.0.0`

### 4. 관측 로그 / 에러 메시지

```text
Error: listen EPERM: operation not permitted 0.0.0.0
```

### 5. 영향 범위

- 영향 엔드포인트: e2e 환경의 `/health`
- 영향 모듈: 테스트 실행 인프라
- 사용자 영향: 없음

### 6. 원인 분석

- 직접 원인: 테스트 실행 환경에서 listen 권한 제한
- 근본 원인: 현재 sandbox/실행 환경 제약 가능성
- 코드 문제인지 환경 문제인지: 환경 문제로 우선 분류

### 7. 해결 방법

- bind 가능한 환경에서 재실행
- 필요 시 e2e 테스트 구성을 환경 친화적으로 조정

### 8. 검증 결과

- 단위 테스트는 통과
- e2e 는 현재 환경에서 미해결

### 9. 재발 방지

- e2e 실행 전 환경 제약 명시
- CI 또는 별도 개발 환경에서 e2e 검증 분리 검토

## 9. 관련 문서

- 구조 파악: [REPOSITORY_MAP.md](./REPOSITORY_MAP.md)
- 흐름 파악: [MESSAGE_FLOW.md](./MESSAGE_FLOW.md)
- 아키텍처 파악: [ARCHITECTURE.md](./ARCHITECTURE.md)
- 통신 규격 확인: [DATA_CONTRACT.md](./DATA_CONTRACT.md)
- 개발 규칙 확인: [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)
