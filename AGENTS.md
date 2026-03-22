# AGENTS.md

## 목적

이 저장소는 문서 기반으로 작업한다. 에이전트와 개발자는 작업 전에 필요한 문서를 먼저 읽고, 코드 변경 시 관련 문서를 함께 갱신해 문서와 구현이 어긋나지 않게 유지한다.

## 작업 시작 규칙

- 항상 먼저 `docs/DOCS_READING_ORDER.md`를 확인한다.
- 기본 진입 문서는 아래 3개다.
  - `docs/REPOSITORY_MAP.md`
  - `docs/ARCHITECTURE.md`
  - `docs/MESSAGE_FLOW.md`
- 작업 유형별로 필요한 문서만 추가로 읽는다.
  - API/DTO/응답 변경: `docs/DATA_CONTRACT.md`
  - 기능 추가/구조 확장: `docs/DEVELOPMENT_GUIDE.md`
  - 장애 분석/테스트 이슈: `docs/TROUBLESHOOTING.md`

## 작업 원칙

- 추측보다 문서와 코드를 우선한다.
- 문서와 코드가 다르면 코드를 기준으로 확인하고 문서를 수정한다.
- 구조, 흐름, 계약, 운영 방식이 바뀌면 관련 문서를 같은 작업 안에서 함께 갱신한다.
- 큰 변경이나 중요한 판단은 필요 시 `docs/WORKLOG_YYYY-MM-DD_*.md`로 남긴다.

## 문서 갱신 매핑

- 파일 위치, 디렉토리, 엔트리포인트 변경:
  - `docs/REPOSITORY_MAP.md`
- 시스템 구성, 모듈 책임, 외부 의존성 변경:
  - `docs/ARCHITECTURE.md`
- 요청 처리 순서, 내부 데이터 흐름 변경:
  - `docs/MESSAGE_FLOW.md`
- 엔드포인트, DTO, 응답 형식, 검증 규칙 변경:
  - `docs/DATA_CONTRACT.md`
- 개발 규칙, 구조 패턴 변경:
  - `docs/DEVELOPMENT_GUIDE.md`
- 장애 원인, 해결, 재발 방지 지식 축적:
  - `docs/TROUBLESHOOTING.md`

## 문서 운영 규칙

- 같은 내용을 여러 문서에 중복해서 쓰지 말고 역할에 맞는 문서 하나에 우선 반영한다.
- 새 문서가 필요하면 `docs/DOCS_READING_ORDER.md`에도 읽기 위치를 연결한다.
- 테스트 결과 보고 형식은 `docs/TEST_REPORT_TEMPLATES.md`를 따른다.

## 보고 규칙

- 긴 로그 대신 요약, 이슈, 다음 액션 중심으로 보고한다.
- 테스트 작업은 아래 순서로 정리한다.
  - 전체 결과
  - 모듈별 결과
  - 실패/리스크
  - 후속 조치
