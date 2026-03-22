# Docs Reading Order

## 1. 문서 목적

이 문서는 `docs/` 아래 문서를 어떤 순서로 보면 가장 효율적인지 안내하는 문서다.  
문서가 늘어날수록 처음부터 전부 읽는 방식은 비효율적이므로, 목적별 추천 순서를 제공한다.

## 2. 가장 추천하는 기본 순서

처음 프로젝트에 진입할 때는 아래 순서가 가장 효율적이다.

1. [REPOSITORY_MAP.md](./REPOSITORY_MAP.md)
2. [ARCHITECTURE.md](./ARCHITECTURE.md)
3. [MESSAGE_FLOW.md](./MESSAGE_FLOW.md)
4. [DATA_CONTRACT.md](./DATA_CONTRACT.md)
5. [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)
6. [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

### 이유

- `REPOSITORY_MAP`
  - 디렉토리 구조와 어디를 먼저 봐야 하는지 잡아준다.

- `ARCHITECTURE`
  - 시스템 경계, 계층, 외부 시스템 연결을 이해하게 해준다.

- `MESSAGE_FLOW`
  - 실제 요청과 데이터가 어디로 흐르는지 보여준다.

- `DATA_CONTRACT`
  - API 요청/응답 규격과 파라미터를 확인하게 해준다.

- `DEVELOPMENT_GUIDE`
  - 코드를 어떻게 추가하고 어떤 규칙으로 작성해야 하는지 정리한다.

- `TROUBLESHOOTING`
  - 테스트와 장애 분석 시 어떤 식으로 접근해야 하는지 알려준다.

## 3. 목적별 추천 순서

### 3-1. 프로젝트 처음 파악할 때

1. [REPOSITORY_MAP.md](./REPOSITORY_MAP.md)
2. [ARCHITECTURE.md](./ARCHITECTURE.md)
3. [MESSAGE_FLOW.md](./MESSAGE_FLOW.md)

### 이유

- 구조
- 시스템 경계
- 실제 흐름

이 세 개를 먼저 보면 코드에 들어가기 전 큰 그림이 잡힌다.

### 3-2. API 연동이나 프론트 연동 전에 볼 순서

1. [DATA_CONTRACT.md](./DATA_CONTRACT.md)
2. [MESSAGE_FLOW.md](./MESSAGE_FLOW.md)
3. [ARCHITECTURE.md](./ARCHITECTURE.md)

### 이유

- `DATA_CONTRACT`
  - 실제 요청/응답 필드와 검증 규칙 확인

- `MESSAGE_FLOW`
  - 요청이 서버 안에서 어떻게 처리되는지 확인

- `ARCHITECTURE`
  - 외부 시스템 경계와 의존성 확인

### 3-3. 신규 기능을 추가할 때

1. [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)
2. [ARCHITECTURE.md](./ARCHITECTURE.md)
3. [MESSAGE_FLOW.md](./MESSAGE_FLOW.md)
4. [DATA_CONTRACT.md](./DATA_CONTRACT.md)
5. [REPOSITORY_MAP.md](./REPOSITORY_MAP.md)

### 이유

- 먼저 개발 규칙을 보고
- 그 다음 구조와 흐름을 이해하고
- 마지막에 실제 파일 위치를 빠르게 찾는 순서가 효율적이다.

### 3-4. 장애 분석을 할 때

1. [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. [MESSAGE_FLOW.md](./MESSAGE_FLOW.md)
3. [DATA_CONTRACT.md](./DATA_CONTRACT.md)
4. [ARCHITECTURE.md](./ARCHITECTURE.md)

### 이유

- `TROUBLESHOOTING`
  - 장애 기록 방식과 대표 장애 유형 확인

- `MESSAGE_FLOW`
  - 어디서 흐름이 끊기는지 찾기 쉬움

- `DATA_CONTRACT`
  - 요청 형식 문제인지 바로 확인 가능

- `ARCHITECTURE`
  - 외부 시스템이나 계층 경계 문제인지 확인 가능

### 3-5. 코드 리뷰나 영향 범위 분석을 할 때

1. [ARCHITECTURE.md](./ARCHITECTURE.md)
2. [MESSAGE_FLOW.md](./MESSAGE_FLOW.md)
3. [REPOSITORY_MAP.md](./REPOSITORY_MAP.md)
4. [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)

### 이유

- 먼저 시스템 경계와 영향 범위를 보고
- 실제 흐름을 본 뒤
- 파일 위치와 구조 규칙까지 확인하는 편이 빠르다.

## 4. 문서별 역할 요약

- [REPOSITORY_MAP.md](./REPOSITORY_MAP.md)
  - 디렉토리 구조, 공통 코드 위치, 엔트리포인트 안내

- [ARCHITECTURE.md](./ARCHITECTURE.md)
  - 시스템 경계, 계층 구조, 외부 시스템, 배포 구조 설명

- [MESSAGE_FLOW.md](./MESSAGE_FLOW.md)
  - 요청과 데이터가 모듈을 거쳐 흐르는 순서 설명

- [DATA_CONTRACT.md](./DATA_CONTRACT.md)
  - API 요청/응답 형식, 파라미터, 에러 포맷 설명

- [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)
  - 신규 기능 추가 방식, controller/module/shared 사용 규칙 설명

- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
  - 테스트 결과 기반 장애 분석, 해결, 재발 방지 기록용

- [TEST_REPORT_TEMPLATES.md](./TEST_REPORT_TEMPLATES.md)
  - 유닛테스트, E2E, 결과검증 보고 형식 템플릿

- [SERVICE_DEPENDENCY.md](./SERVICE_DEPENDENCY.md)
  - 현재 저장소 직접 근거보다는 외부 모노레포 가정 기반 서비스 의존 관계 정리
  - 현재 프로젝트를 바로 개발할 때의 우선 문서는 아니다

- [WORKLOG_2026-03-22_RUNTIME_VALIDATION.md](./WORKLOG_2026-03-22_RUNTIME_VALIDATION.md)
  - 실제 런타임 환경에서 `system-e2e` 검증을 완료한 기록

## 5. 현재 프로젝트 기준 추천 우선순위

현재 저장소는 단일 NestJS RAG 서버이므로, 실무적으로는 아래 5개가 우선이다.

1. [REPOSITORY_MAP.md](./REPOSITORY_MAP.md)
2. [ARCHITECTURE.md](./ARCHITECTURE.md)
3. [MESSAGE_FLOW.md](./MESSAGE_FLOW.md)
4. [DATA_CONTRACT.md](./DATA_CONTRACT.md)
5. [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)

`TROUBLESHOOTING.md` 는 테스트나 장애 대응 시점에 바로 보면 되고, `SERVICE_DEPENDENCY.md` 는 현재 저장소 직접 개발 기준 우선순위는 낮다.

## 6. 가장 짧은 입문 루트

시간이 없을 때는 아래 3개만 먼저 보면 된다.

1. [REPOSITORY_MAP.md](./REPOSITORY_MAP.md)
2. [ARCHITECTURE.md](./ARCHITECTURE.md)
3. [MESSAGE_FLOW.md](./MESSAGE_FLOW.md)

이 3개를 본 뒤 필요한 상황에 따라 다음으로 넘어간다.

- API 작업이면: [DATA_CONTRACT.md](./DATA_CONTRACT.md)
- 코드 추가면: [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)
- 장애 대응이면: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- 테스트 보고 형식 확인이면: [TEST_REPORT_TEMPLATES.md](./TEST_REPORT_TEMPLATES.md)
