# NestJS RAG MVP (Chroma + Ollama + LangChain.js)

사내 문서 기반 사업기획서 작성 MVP용 RAG 인프라입니다.

## 실행

```bash
docker-compose up -d
# (옵션) API도 함께 띄울 경우
# docker-compose --profile api up -d

# 모델 다운로드 (컨테이너 내부에서 실행)
# docker exec -it rag-ollama ollama pull llama3:8b
# docker exec -it rag-ollama ollama pull nomic-embed-text
#
# (또는 curl)
# curl -X POST http://localhost:11434/api/pull -d '{"name":"llama3:8b"}'
# curl -X POST http://localhost:11434/api/pull -d '{"name":"nomic-embed-text"}'

npm install
npm run start:dev
```

실제 시스템 e2e 검증은 API와 외부 의존성이 모두 떠 있는 상태에서 아래로 실행합니다.

```bash
npm run test:system-e2e
```

## 환경변수

`.env.example` 참고:

- `CHROMA_URL` (기본 `http://localhost:8000`)
- `CHROMA_TENANT` (기본 `default_tenant`)
- `CHROMA_DATABASE` (기본 `default_database`)
- `OLLAMA_BASE_URL` (기본 `http://localhost:11434`)
- `OLLAMA_CHAT_MODEL` (기본 `llama3:8b`)
- `OLLAMA_EMBED_MODEL` (기본 `nomic-embed-text`)
- `COLLECTION_NAME` (기본 `mvp_docs`)
- `PORT` (기본 `3000`)

## WSL2 + GPU 확인

```bash
docker run --gpus all nvidia/cuda:12.3.2-base-ubuntu22.04 nvidia-smi
```

## MVP 제한사항 (중요)

- 이미지/OCR 미지원
- 스캔 PDF(이미지 기반) 또는 텍스트 추출 불가 문서는 인덱싱 실패 처리
- 표/도형/이미지에서 텍스트가 추출되지 않으면 무시(레이아웃 보존 없음)
- 인덱싱 실패 시 파일별 `status=failed`와 `reason` 반환, 다른 파일은 계속 처리(부분 성공 허용)

## API

Swagger: `http://localhost:3000/docs`

### 1) 텍스트 직접 인덱싱

`POST /ingest/text`

```bash
curl -X POST http://localhost:3000/ingest/text \
  -H "Content-Type: application/json" \
  -d '{
    "text":"내부 기획 문서 초안: 목표는 RAG 기반 근거 응답 제공",
    "metadata":{"project":"mvp","docType":"memo"}
  }'
```

### 2) 파일 업로드 인덱싱

`POST /ingest/files` (multipart/form-data, 다중 파일)

```bash
curl -X POST http://localhost:3000/ingest/files \
  -F "project=internal-mvp" \
  -F "docType=planning" \
  -F "files=@data/sample_docs/sample_text.pdf" \
  -F "files=@data/sample_docs/sample_plan.docx" \
  -F "files=@data/sample_docs/sample_pitch.pptx"
```

### 3) 질의

`POST /query`

```bash
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d '{
    "question":"이 MVP의 핵심 범위를 요약해줘",
    "topK": 6,
    "filters": {"project": "internal-mvp"}
  }'
```

응답에는 `answer`, `citations`, `retrieved`가 포함됩니다. `citations`는 반드시 retrieved excerpt 기반입니다.

### 4) 헬스체크

`GET /health` (Chroma/Ollama 연결 확인 포함)

```bash
curl http://localhost:3000/health
```

## 시스템 e2e 완료 기준

- `GET /health` 가 `200` 이고 `status=ok`, `chroma=ok`, `ollama=ok`
- `POST /ingest/text` 가 성공하고 `ingested > 0`
- `POST /ingest/files` 에서 최소 1개 이상 `status=ok`
- `POST /query` 응답에 `answer`, `citations`, `retrieved` 가 모두 유효하게 포함

기본 검증 스크립트는 아래 순서로 실제 흐름을 점검합니다.

1. `/health`
2. `/ingest/text`
3. `/ingest/files`
4. `/query`

기본 샘플 파일은 `data/sample_docs/sample_notes.txt`, `data/sample_docs/sample_overview.md` 이며, 필요하면 `API_BASE_URL`, `PROJECT_KEY`, `FILE_ONE`, `FILE_TWO` 환경변수로 바꿀 수 있습니다.

현재 런타임은 Chroma 서버의 v1 HTTP API에 맞춰 동작합니다. 따라서 `chromadb/chroma:0.5.x` 조합에서도 컬렉션 생성, 문서 upsert, similarity query가 실제로 완료됩니다.

## 샘플 문서

- `data/sample_docs/sample_text.pdf` (텍스트 PDF)
- `data/sample_docs/sample_plan.docx`
- `data/sample_docs/sample_pitch.pptx`
- `data/sample_docs/sample_notes.txt`
- `data/sample_docs/sample_overview.md`

## 프로젝트 파일 트리

```text
.
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── data
│   ├── sample_docs
│   │   ├── sample_text.pdf
│   │   ├── sample_plan.docx
│   │   ├── sample_pitch.pptx
│   │   ├── sample_notes.txt
│   │   └── sample_overview.md
│   └── uploads
└── src
    ├── app.controller.ts
    ├── app.module.ts
    ├── main.ts
    ├── common
    │   └── filters
    │       └── http-exception.filter.ts
    └── rag
        ├── rag.module.ts
        ├── health
        │   ├── health.controller.ts
        │   ├── health.service.ts
        │   └── health.module.ts
        ├── llm
        │   ├── llm.module.ts
        │   └── ollama.service.ts
        ├── shared
        │   └── constants.ts
        ├── chroma
        │   ├── chroma.module.ts
        │   └── chroma.service.ts
        ├── vector-store
        │   └── vector-store.module.ts
        ├── ingest
        │   ├── ingest.controller.ts
        │   ├── ingest.module.ts
        │   ├── dto
        │   │   ├── ingest-files.dto.ts
        │   │   └── ingest-text.dto.ts
        │   └── services
        │       ├── chunking.service.ts
        │       ├── ingest.service.ts
        │       └── text-extractor.service.ts
        └── query
            ├── query.controller.ts
            ├── query.module.ts
            ├── query.service.ts
            └── dto
                └── query.dto.ts
```

## Troubleshooting

- GPU 미인식(WSL2/드라이버/toolkit)
  - WSL2에서 NVIDIA 드라이버 및 Docker Desktop GPU 설정 확인
  - `docker run --gpus all nvidia/cuda:12.3.2-base-ubuntu22.04 nvidia-smi`로 확인
- Ollama 모델 미다운로드
  - `docker exec -it rag-ollama ollama pull llama3:8b`
  - `docker exec -it rag-ollama ollama pull nomic-embed-text`
- 텍스트 추출 실패(스캔 PDF 등)
  - `/ingest/files` 결과에서 해당 파일은 `status=failed`
  - `reason`: `Text extraction failed or empty content. Scanned/image-based files are not supported in MVP.`
- 포트 충돌 (`8000` 또는 `3000`)
  - 사용 중 프로세스를 종료하거나 포트를 변경
- Chroma 연결 실패
  - `docker-compose ps`로 컨테이너 상태 확인
  - `curl http://localhost:8000/api/v1/heartbeat` 확인
