# Worklog: Runtime Validation

## 1. 작업 일시

- 수행 일시: 2026-03-22T13:19:30+09:00

## 2. 선행 확인 문서

`docs/DOCS_READING_ORDER.md` 기준으로 아래 문서를 확인했다.

1. `docs/REPOSITORY_MAP.md`
2. `docs/ARCHITECTURE.md`
3. `docs/MESSAGE_FLOW.md`
4. `docs/DATA_CONTRACT.md`
5. `docs/TROUBLESHOOTING.md`
6. `README.md`

## 3. 이번 작업 목표

- 현재 환경에서 MVP가 실제로 끝까지 동작하는지 확인
- 유닛테스트 통과와 실제 런타임 검증을 분리해서 기록
- 재현 가능한 검증 경로를 문서로 남기기

## 4. 실행 환경

- 작업 디렉토리: `/home/kwon/project/langchain`
- API_BASE_URL: `http://127.0.0.1:3000`
- Chroma 컨테이너: `rag-chroma`
- Ollama 컨테이너: `rag-ollama`
- `.env` 기준 주요 설정
  - `CHROMA_URL=http://localhost:8000`
  - `OLLAMA_BASE_URL=http://localhost:11434`
  - `COLLECTION_NAME=mvp_docs`

## 5. 수행한 확인 절차

### 5-1. 외부 의존성 상태 확인

- 실행 명령어: `docker compose ps`
- 결과
  - `rag-chroma`: `Up ... (healthy)`
  - `rag-ollama`: `Up ... (healthy)`

### 5-2. API health 확인

- 실행 명령어: `curl -i -sS http://127.0.0.1:3000/health`
- 결과: `HTTP/1.1 200 OK`
- 응답 본문:

```json
{"status":"ok","chroma":"ok","ollama":"ok","timestamp":"2026-03-22T04:16:56.082Z"}
```

### 5-3. 시스템 e2e 실행

- 실행 명령어: `npm run test:system-e2e`
- 결과: `PASS`
- 스크립트 기준 검증 순서
  1. `/health`
  2. `/ingest/text`
  3. `/ingest/files`
  4. `/ingest/jobs/:jobId`
  5. `/query`

### 5-4. 실제 외부 호출 로그 확인

- Chroma 로그 확인 결과
  - 컬렉션 upsert 요청 성공
  - query 요청 성공
- Ollama 로그 확인 결과
  - `/api/chat` 요청 성공
  - 첫 모델 로딩에 약 20초 이상 소요

## 6. 검증 결과 요약

| 구분 | 명령어 | 결과 | 해석 |
|---|---|---|---|
| Unit | `npm test -- --runInBand` | PASS | 코드 레벨 검증 완료 |
| Runtime Health | `curl http://127.0.0.1:3000/health` | PASS | API, Chroma, Ollama 연결 정상 |
| System E2E | `npm run test:system-e2e` | PASS | ingest/query 실제 흐름 완료 |
| Dependency Check | `docker compose ps` | PASS | Chroma, Ollama healthy |

## 7. 해석

- 현재 저장소는 "유닛테스트만 통과한 상태"가 아니라, 현재 머신 기준 실제 RAG 흐름이 한 번 끝까지 성공한 상태다.
- 즉, `health -> ingest/text -> ingest/files -> job polling -> query` 가 실제로 연결되었다.
- 따라서 기능 MVP로서의 최소 실행 가능성은 확인되었다고 볼 수 있다.

## 8. 확인된 운영상 특성

- Ollama 첫 응답 시 모델 로딩 시간이 길 수 있다.
- 파일 적재는 비동기 job 구조이므로, `/ingest/files` 직후보다 `/ingest/jobs/:jobId` 완료 여부가 중요하다.
- 현재 검증은 "현재 환경에서의 성공 사례"이므로, 다른 머신에서는 모델 다운로드 상태와 포트 상태를 먼저 확인해야 한다.

## 9. 남은 리스크

- 결과 품질 자체는 별도 결과검증 단계가 필요하다.
- 인증, 멀티테넌시, 운영용 모니터링은 아직 MVP 이후 과제다.
- 임의의 수동 `curl POST` 재호출은 실행 환경 제약으로 일시적으로 흔들릴 수 있어, 운영 판단은 `system-e2e` 기준으로 보는 편이 더 안정적이다.

## 10. 다음 권장 작업

1. `docs/TEST_REPORT_TEMPLATES.md` 기준 E2E 리포트 정식 기록
2. 결과 품질 검증용 질문 세트 작성
3. 실동작 확인 절차를 체크리스트로 별도 문서화
