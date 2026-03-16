# Data Contract

## 1. 문서 목적

이 문서는 현재 프로젝트의 통신 규격과 주요 파라미터를 정리한 문서다.  
주요 대상은 다음과 같다.

- HTTP API 요청 규격
- 요청 파라미터와 검증 규칙
- 응답 포맷
- 에러 응답 포맷
- 내부적으로 생성되는 주요 메타데이터 계약

현재 프로젝트는 단일 NestJS RAG API 서버이며, 공개 API 엔드포인트는 `/ingest/text`, `/ingest/files`, `/query`, `/health` 다.  
근거: [src/rag/ingest/ingest.controller.ts](../src/rag/ingest/ingest.controller.ts), [src/rag/query/query.controller.ts](../src/rag/query/query.controller.ts), [src/rag/health/health.controller.ts](../src/rag/health/health.controller.ts)

## 2. 공통 규약

### 확실한 내용

- API 기본 포트는 `3000` 이다.  
  근거: [src/main.ts](../src/main.ts), [.env.example](../.env.example)

- Swagger 문서는 `/docs` 에서 제공된다.  
  근거: [src/main.ts](../src/main.ts)

- 전역 검증은 `ValidationPipe` 로 수행된다.  
  근거: [src/main.ts](../src/main.ts)

- 전역 검증 옵션은 다음과 같다.
  - `whitelist: true`
  - `transform: true`
  - `enableImplicitConversion: true`
  - `forbidNonWhitelisted: true`  
  근거: [src/main.ts](../src/main.ts)

- 따라서 DTO 에 정의되지 않은 필드는 요청에서 허용되지 않는다.  
  근거: [src/main.ts](../src/main.ts)

### Content-Type 규약

- `POST /ingest/text`
  - `Content-Type: application/json`

- `POST /ingest/files`
  - `Content-Type: multipart/form-data`

- `POST /query`
  - `Content-Type: application/json`

- `GET /health`
  - body 없음

## 3. 엔드포인트 요약

| Method | Path | 목적 | 요청 형식 |
|---|---|---|---|
| `POST` | `/ingest/text` | 텍스트 직접 인덱싱 | JSON |
| `POST` | `/ingest/files` | 파일 업로드 인덱싱 | multipart/form-data |
| `POST` | `/query` | 검색 기반 질의 응답 | JSON |
| `GET` | `/health` | Chroma/Ollama 상태 확인 | 없음 |

근거: [src/rag/ingest/ingest.controller.ts](../src/rag/ingest/ingest.controller.ts), [src/rag/query/query.controller.ts](../src/rag/query/query.controller.ts), [src/rag/health/health.controller.ts](../src/rag/health/health.controller.ts)

## 4. Request Contract

### 4-1. `POST /ingest/text`

### 요청 바디

```json
{
  "text": "string",
  "metadata": {
    "anyKey": "anyValue"
  }
}
```

### 필드 규격

- `text`
  - 타입: `string`
  - 필수 여부: 필수
  - 검증 규칙: 빈 문자열 불가
  - 비고: 공백만 있는 문자열도 서비스 레벨에서 거부됨

- `metadata`
  - 타입: `object`
  - 필수 여부: 선택
  - 검증 규칙: 객체여야 함
  - 비고: 내부적으로 문자열/숫자/불리언/null 외 값은 JSON 문자열로 직렬화됨

근거: [src/rag/ingest/dto/ingest-text.dto.ts](../src/rag/ingest/dto/ingest-text.dto.ts), [src/rag/ingest/services/ingest.service.ts](../src/rag/ingest/services/ingest.service.ts)

### 요청 예시

```json
{
  "text": "내부 기획 문서 초안: 목표는 RAG 기반 근거 응답 제공",
  "metadata": {
    "project": "mvp",
    "docType": "memo"
  }
}
```

근거: [README.md](../README.md)

### 4-2. `POST /ingest/files`

### 요청 형식

- `multipart/form-data`

### multipart 필드 규격

- `files`
  - 타입: `file[]`
  - 필수 여부: 필수
  - 제한: 최대 20개
  - 비고: 하나도 없으면 `BadRequestException`

- `project`
  - 타입: `string`
  - 필수 여부: 선택

- `docType`
  - 타입: `string`
  - 필수 여부: 선택

- `createdAt`
  - 타입: `string`
  - 필수 여부: 선택
  - 검증 규칙: ISO date-time 형식

근거: [src/rag/ingest/ingest.controller.ts](../src/rag/ingest/ingest.controller.ts), [src/rag/ingest/dto/ingest-files.dto.ts](../src/rag/ingest/dto/ingest-files.dto.ts)

### 지원 파일 확장자

- `.pdf`
- `.docx`
- `.pptx`
- `.txt`
- `.md`

근거: [src/rag/shared/constants.ts](../src/rag/shared/constants.ts)

### 파일명 저장 규칙

- 업로드 파일은 `data/uploads` 에 저장된다.
- 저장 파일명은 다음 형식이다.

```text
{timestamp}-{safeBasename}{extension}
```

- `safeBasename` 은 영문, 숫자, `-`, `_` 외 문자를 `_` 로 치환한다.
- 확장자는 소문자로 변환된다.

근거: [src/rag/ingest/ingest.controller.ts](../src/rag/ingest/ingest.controller.ts)

### 요청 예시

```bash
curl -X POST http://localhost:3000/ingest/files \
  -F "project=internal-mvp" \
  -F "docType=planning" \
  -F "files=@data/sample_docs/sample_text.pdf" \
  -F "files=@data/sample_docs/sample_plan.docx"
```

근거: [README.md](../README.md)

### 4-3. `POST /query`

### 요청 바디

```json
{
  "question": "string",
  "topK": 6,
  "filters": {
    "project": "internal-mvp"
  }
}
```

### 필드 규격

- `question`
  - 타입: `string`
  - 필수 여부: 필수
  - 검증 규칙: 빈 문자열 불가

- `topK`
  - 타입: `number`
  - 필수 여부: 선택
  - 기본값: `6`
  - 검증 규칙: 정수, `1 <= topK <= 20`
  - 비고: 문자열이어도 암시적 숫자 변환 가능

- `filters`
  - 타입: `object`
  - 필수 여부: 선택
  - 비고: `chromadb` 의 `Where` 타입으로 전달됨

근거: [src/rag/query/dto/query.dto.ts](../src/rag/query/dto/query.dto.ts), [src/rag/query/query.service.ts](../src/rag/query/query.service.ts)

### 요청 예시

```json
{
  "question": "이 MVP의 핵심 범위를 요약해줘",
  "topK": 6,
  "filters": {
    "project": "internal-mvp"
  }
}
```

근거: [README.md](../README.md)

### 4-4. `GET /health`

### 요청 규격

- body 없음
- query parameter 없음
- path parameter 없음

근거: [src/rag/health/health.controller.ts](../src/rag/health/health.controller.ts)

## 5. Response Contract

### 5-1. `POST /ingest/text`

### 성공 응답

```json
{
  "ingested": 3,
  "collection": "mvp_docs"
}
```

### 필드 규격

- `ingested`
  - 타입: `number`
  - 의미: Chroma 에 적재된 청크 수

- `collection`
  - 타입: `string`
  - 의미: 현재 대상 컬렉션명

근거: [src/rag/ingest/ingest.controller.ts](../src/rag/ingest/ingest.controller.ts), [src/rag/chroma/chroma.service.ts](../src/rag/chroma/chroma.service.ts)

### 5-2. `POST /ingest/files`

### 성공 응답

```json
{
  "files": [
    {
      "filename": "sample_text.pdf",
      "docId": "uuid",
      "ingested": 12,
      "status": "ok"
    },
    {
      "filename": "scan.pdf",
      "docId": "uuid",
      "ingested": 0,
      "status": "failed",
      "reason": "Text extraction failed or empty content. Scanned/image-based files are not supported in MVP."
    }
  ],
  "collection": "mvp_docs"
}
```

### `files[]` 항목 규격

- `filename`
  - 타입: `string`
  - 의미: 원본 업로드 파일명

- `docId`
  - 타입: `string`
  - 의미: 문서 단위 식별자
  - 비고: 예외 fallback 시 `n/a` 일 수 있음

- `ingested`
  - 타입: `number`
  - 의미: 적재된 청크 수

- `status`
  - 타입: `'ok' | 'failed'`

- `reason`
  - 타입: `string | undefined`
  - 의미: 실패 원인

- `collection`
  - 타입: `string`

근거: [src/rag/ingest/ingest.controller.ts](../src/rag/ingest/ingest.controller.ts), [src/rag/ingest/services/ingest.service.ts](../src/rag/ingest/services/ingest.service.ts)

### 5-3. `POST /query`

### 성공 응답

```json
{
  "answer": "답변 문자열",
  "citations": [
    {
      "source": "sample.pdf",
      "docId": "uuid",
      "pageOrSlide": 1,
      "chunkId": "uuid-1-1",
      "excerpt": "근거 일부"
    }
  ],
  "retrieved": [
    {
      "source": "sample.pdf",
      "score": 0.123,
      "excerpt": "근거 일부",
      "metadata": {
        "docId": "uuid",
        "pageOrSlide": 1,
        "chunkId": "uuid-1-1"
      }
    }
  ]
}
```

### 필드 규격

- `answer`
  - 타입: `string`
  - 의미: 최종 생성 응답
  - 비고: 검색 결과가 없으면 `근거 부족` 문구 포함

- `citations`
  - 타입: `array`
  - 의미: 응답에 사용된 근거 요약

- `citations[].source`
  - 타입: `string`

- `citations[].docId`
  - 타입: `string | undefined`

- `citations[].pageOrSlide`
  - 타입: `number | undefined`

- `citations[].chunkId`
  - 타입: `string | undefined`

- `citations[].excerpt`
  - 타입: `string`

- `retrieved`
  - 타입: `array`
  - 의미: 검색 결과 원본 요약

- `retrieved[].source`
  - 타입: `string`

- `retrieved[].score`
  - 타입: `number`

- `retrieved[].excerpt`
  - 타입: `string`
  - 비고: 최대 300자까지 잘린 문자열

- `retrieved[].metadata`
  - 타입: `object`

근거: [src/rag/query/query.service.ts](../src/rag/query/query.service.ts)

### 검색 결과 없음 응답

```json
{
  "answer": "근거 부족: 질의와 관련된 문서를 찾지 못했습니다. 문서 인덱싱 상태를 확인해주세요.",
  "citations": [],
  "retrieved": []
}
```

근거: [src/rag/query/query.service.ts](../src/rag/query/query.service.ts)

### 5-4. `GET /health`

### 성공 응답

```json
{
  "status": "ok",
  "chroma": "ok",
  "ollama": "ok",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### 비정상 응답 본문

`HealthController` 는 `degraded` 상태일 때 `503` 을 반환하지만, 본문 details 안에는 동일한 상태 객체가 포함된다.

### 필드 규격

- `status`
  - 타입: `'ok' | 'degraded'`

- `chroma`
  - 타입: `'ok' | 'failed'`

- `ollama`
  - 타입: `'ok' | 'failed'`

- `timestamp`
  - 타입: `string`
  - 형식: ISO datetime

근거: [src/rag/health/health.service.ts](../src/rag/health/health.service.ts), [src/rag/health/health.controller.ts](../src/rag/health/health.controller.ts)

## 6. Error Contract

### 전역 에러 응답 포맷

```json
{
  "code": 400,
  "message": "Validation failed",
  "details": {
    "path": "/query",
    "timestamp": "2025-01-01T00:00:00.000Z",
    "errors": [
      "question should not be empty"
    ],
    "error": "Bad Request"
  }
}
```

### 필드 규격

- `code`
  - 타입: `number`
  - 의미: HTTP status code

- `message`
  - 타입: `string`

- `details`
  - 타입: `object`

- `details.path`
  - 타입: `string`

- `details.timestamp`
  - 타입: `string`
  - 형식: ISO datetime

- `details.errors`
  - 타입: `string[] | undefined`
  - 의미: 검증 실패 상세

- `details.error`
  - 타입: `string`
  - 의미: HTTP 예외 이름

근거: [src/common/filters/http-exception.filter.ts](../src/common/filters/http-exception.filter.ts)

### 주요 에러 케이스

- `POST /ingest/text`
  - `400`: `text` 누락 또는 빈 문자열

- `POST /ingest/files`
  - `400`: 파일 누락
  - `400`: `createdAt` 형식 오류

- `POST /query`
  - `400`: `question` 누락 또는 빈 문자열
  - `400`: `topK` 범위 초과 또는 형식 오류

- `GET /health`
  - `503`: `Chroma` 또는 `Ollama` 중 하나 이상 비정상

- 공통 런타임
  - `500`: similarity search 실패
  - `503`: 외부 시스템 heartbeat/connect 실패

근거: [src/rag/ingest/services/ingest.service.ts](../src/rag/ingest/services/ingest.service.ts), [src/rag/health/health.controller.ts](../src/rag/health/health.controller.ts), [src/rag/chroma/chroma.service.ts](../src/rag/chroma/chroma.service.ts), [src/rag/llm/ollama.service.ts](../src/rag/llm/ollama.service.ts)

## 7. Internal Metadata Contract

### 문서 메타데이터

인덱싱 과정에서 내부적으로 다음 메타데이터가 생성되거나 병합된다.

```json
{
  "docId": "uuid",
  "source": "sample.pdf",
  "docType": "pdf",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "project": "internal-mvp",
  "pageOrSlide": 1,
  "chunkId": "uuid-1-1",
  "startOffset": 0,
  "endOffset": 512
}
```

### 필드 규격

- `docId`
  - 타입: `string`
  - 생성 방식: `randomUUID()`

- `source`
  - 타입: `string`
  - 의미: 원본 파일명 또는 `inline-text`

- `docType`
  - 타입: `string`
  - 의미: 요청 `docType` 또는 파일 확장자 기반 값

- `createdAt`
  - 타입: `string`
  - 형식: ISO datetime

- `project`
  - 타입: `string | null | undefined`

- `pageOrSlide`
  - 타입: `number`

- `chunkId`
  - 타입: `string`
  - 형식: `{docId}-{pageOrSlide}-{chunkIndex}`

- `startOffset`
  - 타입: `number`

- `endOffset`
  - 타입: `number`

### 메타데이터 정규화 규칙

- `string`, `number`, `boolean`, `null` 은 그대로 저장된다.
- 그 외 값은 `JSON.stringify(value)` 로 직렬화된다.

근거: [src/rag/ingest/services/ingest.service.ts](../src/rag/ingest/services/ingest.service.ts), [src/rag/ingest/services/chunking.service.ts](../src/rag/ingest/services/chunking.service.ts)

## 8. External Contract

### 환경변수 계약

- `PORT`
  - 기본값: `3000`

- `CHROMA_URL`
  - 기본값: `http://localhost:8000`

- `OLLAMA_BASE_URL`
  - 기본값: `http://localhost:11434`

- `OLLAMA_CHAT_MODEL`
  - 기본값: `llama3:8b`

- `OLLAMA_EMBED_MODEL`
  - 기본값: `nomic-embed-text`

- `COLLECTION_NAME`
  - 기본값: `mvp_docs`

근거: [.env.example](../.env.example), [src/rag/shared/constants.ts](../src/rag/shared/constants.ts)

### 외부 시스템 연결 규격

- `Chroma heartbeat`
  - `GET {CHROMA_URL}/api/v1/heartbeat`

- `Ollama heartbeat`
  - `GET {OLLAMA_BASE_URL}/api/tags`

근거: [src/rag/chroma/chroma.service.ts](../src/rag/chroma/chroma.service.ts), [src/rag/llm/ollama.service.ts](../src/rag/llm/ollama.service.ts)

## 9. 예시 시퀀스

### 텍스트 인덱싱 예시

요청:

```http
POST /ingest/text
Content-Type: application/json
```

```json
{
  "text": "RAG 기반 사업기획서 작성 MVP",
  "metadata": {
    "project": "mvp",
    "docType": "memo"
  }
}
```

응답:

```json
{
  "ingested": 1,
  "collection": "mvp_docs"
}
```

### 질의 예시

요청:

```http
POST /query
Content-Type: application/json
```

```json
{
  "question": "이 MVP의 핵심 범위를 요약해줘",
  "topK": 6,
  "filters": {
    "project": "mvp"
  }
}
```

응답:

```json
{
  "answer": "핵심 범위는 ... [1]",
  "citations": [
    {
      "source": "inline-text",
      "docId": "uuid",
      "pageOrSlide": 1,
      "chunkId": "uuid-1-1",
      "excerpt": "RAG 기반 사업기획서 작성 MVP"
    }
  ],
  "retrieved": [
    {
      "source": "inline-text",
      "score": 0.12,
      "excerpt": "RAG 기반 사업기획서 작성 MVP",
      "metadata": {
        "project": "mvp"
      }
    }
  ]
}
```

## 10. 확인 필요 사항

- `filters` 의 허용 구조를 문서 차원에서 어디까지 고정할지
- `retrieved[].metadata` 를 외부 계약으로 완전히 공개할지, 일부 필드만 보장할지
- 향후 응답 스키마를 OpenAPI 기반으로 별도 버전 관리할지
