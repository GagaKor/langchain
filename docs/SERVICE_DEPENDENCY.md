# Service Dependency

## 1. 문서 목적

이 문서는 서비스 간 의존 관계와 연결 방식을 빠르게 파악하기 위한 문서다.  
서비스 책임 설명보다 다음을 우선 정리한다.

- 어떤 서비스가 누구를 호출하는지
- `(방식: HTTP/Kafka/RabbitMQ/WebSocket/Shared Package/DB Module)` 중 어떤 방식으로 연결되는지
- 어떤 관계가 코드 근거로 확실한지
- 어떤 관계가 사용자 확인 기반인지
- 어떤 관계가 추정인지

현재 워크스페이스 `/home/kwon/project/langchain` 에서는 `apps/`, `packages/` 구조가 확인되지 않았고, 단일 NestJS RAG 프로젝트만 존재한다. 따라서 아래 운영/레거시 서비스 관계는 사용자 제공 사실을 기준으로 정리하며, 이 워크스페이스에서 직접 확인 가능한 코드는 `없음`으로 명시한다.  
근거: [docs/REPOSITORY_MAP.md](./REPOSITORY_MAP.md), [README.md](../README.md)

## 2. 분석 대상 서비스

### 운영 서비스

- `api-gateway`
- `auth`
- `camera`
- `camera3`
- `event`

### 레거시 서비스

- `macs-backend`
- `macs-socket`
- `macs-cron`

### 외부 시스템

- `frontend`
- `ai-server`

## 3. 의존 관계 요약

### 확실한 내용

- 현재 워크스페이스에는 `apps/api-gateway`, `apps/auth`, `apps/camera`, `apps/camera3`, `apps/event`, `apps/macs-backend`, `apps/macs-socket`, `apps/macs-cron`, `packages/common` 경로가 존재하지 않는다. 따라서 이 문서의 서비스 간 연결은 이 저장소 코드만으로 검증할 수 없다.  
  근거: [docs/REPOSITORY_MAP.md](./REPOSITORY_MAP.md), [README.md](../README.md)

- 현재 워크스페이스에서 코드로 확인되는 외부 의존은 `api -> chroma (방식: HTTP)` 와 `api -> ollama (방식: HTTP)` 뿐이며, Kafka/RabbitMQ/WebSocket 코드는 존재하지 않는다.  
  근거: [src/rag/chroma/chroma.service.ts](../src/rag/chroma/chroma.service.ts), [src/rag/llm/ollama.service.ts](../src/rag/llm/ollama.service.ts), [src/main.ts](../src/main.ts)

### 사용자 확인으로 확정된 내용

- `camera -> ai-server` 또는 AI 처리 파이프라인 방향 연결이 신규 구조의 핵심 일부다 `(방식: Kafka)`.  
  근거: 사용자 확인, "신규 구조는 Kafka 기반", "주요 기능은 AI 서버에 메시지를 보내고, 결과를 받아 이벤트를 저장하고 프론트에 전달"

- `event <- ai-server` 또는 AI 처리 결과 수신 축이 신규 구조의 핵심 일부다 `(방식: Kafka)`.  
  근거: 사용자 확인, "신규 구조는 Kafka 기반", "주요 기능은 AI 서버에 메시지를 보내고, 결과를 받아 이벤트를 저장하고 프론트에 전달"

- `camera` 와 `event` 는 Kafka를 직접 사용하는 서비스다 `(방식: Kafka)`.  
  근거: 사용자 확인

- `auth` 는 Kafka를 직접 사용하지 않는다.  
  근거: 사용자 확인

- `macs-socket` 은 레거시 이벤트 계열 서비스다 `(방식: RabbitMQ/real-time axis)`.  
  근거: 사용자 확인

- `macs-backend` 는 RabbitMQ를 사용하지 않는다.  
  근거: 사용자 확인

- `event` 와 `macs-socket` 은 동시에 운영되지 않으며 서로 다른 버전 축이다.  
  근거: 사용자 확인

- `macs-socket`, `macs-backend`, `macs-cron` 은 하나의 레거시 버전 축이다.  
  근거: 사용자 확인

- `api-gateway` 는 실제 운영 DB를 사용하지 않는다 `(방식: DB Module 없음)`.  
  근거: 사용자 확인

- `event` 는 `DatabaseModule` 을 사용하고 메시지 처리 시 interceptor 가 `QueryRunner` 를 가져오는 방식으로 동작한다 `(방식: DB Module)`.  
  근거: 사용자 확인

- 앱 디렉토리 하나가 서버 하나에 대응하며, `frontend` 와 `ai-server` 는 이 모노레포 밖의 별도 시스템이다.  
  근거: 사용자 확인

### 추정 내용

- `api-gateway -> auth` `(방식: HTTP)` 관계가 있을 가능성이 높다. 서비스명과 게이트웨이 역할상 인증 관련 요청을 라우팅할 개연성이 있다.  
  근거: 서비스명 기반 추정

- `api-gateway -> camera` `(방식: HTTP)` 관계가 있을 가능성이 높다. 게이트웨이가 운영 서비스 진입점 역할을 한다면 camera 관련 API 라우팅을 담당할 가능성이 있다.  
  근거: 서비스명 기반 추정

- `api-gateway -> event` `(방식: HTTP)` 관계가 있을 가능성이 높다. 신규 이벤트 조회/전달 API를 게이트웨이 뒤에 둘 가능성이 있다.  
  근거: 서비스명 기반 추정

- `event -> frontend` `(방식: WebSocket)` 관계가 있을 가능성이 높다. "결과를 받아 이벤트를 저장하고 프론트에 전달" 이라는 사용자 설명상 실시간 전달 주체가 event일 개연성이 높다.  
  근거: 사용자 설명 기반 추정

- `macs-socket -> frontend` `(방식: WebSocket)` 관계가 있을 가능성이 높다. 레거시 이벤트 계열 서비스라는 사용자 확인과 서비스명상 실시간 송신 역할일 개연성이 높다.  
  근거: 사용자 확인 + 서비스명 기반 추정

- `macs-cron -> macs-backend` 또는 `macs-cron -> macs-socket` 간 직접 연결이 있을 수 있으나, 연결 방식은 현재 정보만으로 특정할 수 없다 `(방식: 미상)`.  
  근거: 레거시 버전 축이라는 사용자 확인

- `camera3` 의 실질적 outbound dependency 는 `camera` 와 유사하거나 AI 처리 파이프라인 일부일 가능성이 있으나, 현 정보만으로는 확정할 수 없다.  
  근거: 서비스명 기반 추정

### 확인 필요 사항

- 실제 HTTP 호출이 직접 서비스 호출인지, `api-gateway` 의 프록시/라우팅인지
- `camera3` 의 실제 outbound dependency
- 레거시 서비스 간 직접 호출 여부
- `macs-cron` 이 `macs-backend` 또는 `macs-socket` 과 어떤 방식으로 연결되는지
- `event -> frontend` 가 WebSocket이 맞는지, 또는 다른 push 메커니즘인지
- 신규 구조에서 Kafka producer/consumer 토픽 분리가 어떻게 되어 있는지

## 4. 서비스별 outbound dependency

### api-gateway

- 호출 대상
  - `auth`
  - `camera`
  - `event`
- 연결 방식
  - `(방식: HTTP, 추정)`
- 근거
  - 사용자 제공 운영 서비스 목록
  - 게이트웨이 서비스명 기반 추정
  - 현재 워크스페이스에는 해당 코드 없음

### auth

- 호출 대상
  - 코드로 확인된 대상 없음
- 연결 방식
  - `(방식: Kafka 직접 사용 없음, 사용자 확인)`
  - `(방식: HTTP/DB/외부 호출 미상)`
- 근거
  - 사용자 확인: `auth` 는 Kafka를 직접 사용하지 않음
  - 현재 워크스페이스에는 해당 코드 없음

### camera

- 호출 대상
  - `ai-server`
- 연결 방식
  - `(방식: Kafka, 사용자 확인 + 추정)`
- 근거
  - 사용자 확인: `camera` 는 Kafka 직접 사용
  - 사용자 설명: 주요 기능은 AI 서버에 메시지를 보냄
  - 현재 워크스페이스에는 해당 코드 없음

### camera3

- 호출 대상
  - 미상
- 연결 방식
  - `(방식: 미상)`
- 근거
  - 운영 서비스 목록에는 있으나, Kafka 직접 사용 여부나 다른 outbound 관계에 대한 사용자 확정 사실 없음
  - 현재 워크스페이스에는 해당 코드 없음

### event

- 호출 대상
  - `frontend`
  - 공통 `DatabaseModule`
- 연결 방식
  - `(방식: WebSocket, 추정)`
  - `(방식: DB Module, 사용자 확인)`
  - `(방식: Kafka consumer, 사용자 확인 + 추정)`
- 근거
  - 사용자 확인: `event` 는 Kafka 직접 사용
  - 사용자 확인: `event` 는 `DatabaseModule` 사용, interceptor 가 `QueryRunner` 사용
  - 사용자 설명: 결과를 받아 이벤트를 저장하고 프론트에 전달
  - 현재 워크스페이스에는 해당 코드 없음

### macs-backend

- 호출 대상
  - 미상
- 연결 방식
  - `(방식: RabbitMQ 사용 없음, 사용자 확인)`
  - `(방식: 기타 HTTP/DB 미상)`
- 근거
  - 사용자 확인: `macs-backend` 는 RabbitMQ를 사용하지 않음
  - 현재 워크스페이스에는 해당 코드 없음

### macs-socket

- 호출 대상
  - `frontend`
- 연결 방식
  - `(방식: RabbitMQ consumer, 사용자 확인)`
  - `(방식: WebSocket, 추정)`
- 근거
  - 사용자 확인: 레거시 이벤트 계열 서비스는 `macs-socket`
  - 사용자 확인: 레거시 구조는 RabbitMQ 기반
  - 서비스명과 역할상 실시간 전달 주체로 추정
  - 현재 워크스페이스에는 해당 코드 없음

### macs-cron

- 호출 대상
  - 미상
- 연결 방식
  - `(방식: 미상)`
- 근거
  - 사용자 확인: 레거시 버전 축에 포함
  - 현재 워크스페이스에는 해당 코드 없음

## 5. 메시징 관계

### Kafka

- producer
  - `camera` `(사용자 확인)`
  - `event` `(직접 사용 서비스라는 점만 사용자 확인, producer 여부는 미상)`
- consumer
  - `event` `(AI 결과 수신 축으로 추정)`
  - `camera` `(직접 사용 서비스라는 점만 사용자 확인, consumer 여부는 미상)`
- 관련 서비스
  - `camera`
  - `event`
  - `ai-server` 외부 시스템
- 관련 공통 코드 위치
  - 사용자 제공 기준: `packages/common` 의 Kafka 관련 계층
  - 현재 워크스페이스 코드 기준: 해당 경로 없음

### RabbitMQ

- publisher
  - 미상
- consumer
  - `macs-socket` `(사용자 확인 기반 레거시 이벤트 계열 서비스)`
- 관련 서비스
  - `macs-socket`
  - `macs-backend` `(RabbitMQ 사용 안 함: 사용자 확인)`
  - `macs-cron` `(관계 미상)`
- 관련 코드 위치
  - 사용자 요청 기준 조사 대상은 `RabbitMQ 관련 코드`
  - 현재 워크스페이스 코드 기준: 해당 경로 없음

## 6. 실시간 전달 관계

### WebSocket

- 송신 서비스
  - `event` `(추정)`
  - `macs-socket` `(추정)`
- 수신 대상
  - `frontend` 외부 시스템
- 관련 코드 위치
  - 사용자 요청 기준 조사 대상은 `websocket 관련 코드`
  - 현재 워크스페이스 코드 기준: WebSocket 관련 코드 없음

## 7. 공통 패키지 의존 관계

### packages/common

- 어떤 서비스가 사용하는지
  - 운영 서비스들은 `packages/common` 에 의존하는 구조일 가능성이 높다 `(사용자 제공 공통 패키지 목록 기반)`
  - 특히 `event` 는 `DatabaseModule` 사용이 사용자 확인으로 확정
  - `camera`, `event` 는 Kafka 직접 사용 서비스이므로 Kafka 계층 의존 가능성이 높다 `(추정)`
- 어떤 계층(DB/Kafka/HTTP/DTO/설정)에 의존하는지
  - `event -> packages/common (방식: DB Module, 사용자 확인)`
  - `camera -> packages/common (방식: Kafka, 추정)`
  - `event -> packages/common (방식: Kafka, 추정)`
  - 운영 서비스 전반 -> `packages/common` `(방식: DTO/설정/HTTP 공통화 가능성, 추정)`
- 코드 근거
  - 현재 워크스페이스에는 `packages/common` 경로 없음
  - 사용자 제공 기준만 존재

## 8. 추천 의존 관계 그래프

- `api-gateway -> auth (방식: HTTP, 추정)`
- `api-gateway -> camera (방식: HTTP, 추정)`
- `api-gateway -> event (방식: HTTP, 추정)`
- `camera -> ai-server (방식: Kafka, 사용자 확인 + 추정)`
- `ai-server -> event (방식: Kafka, 사용자 확인 + 추정)`
- `event -> frontend (방식: WebSocket, 추정)`
- `event -> DatabaseModule (방식: DB Module, 사용자 확인)`
- `macs-socket -> frontend (방식: WebSocket, 추정)`
- `legacy services -> macs-socket (방식: RabbitMQ axis, 사용자 확인 일부 + 추정)`
- `api-gateway -> DB (방식: DB Module 없음, 사용자 확인)`

## 9. 확인 필요 항목

- 실제 HTTP 호출이 직접 호출인지 gateway 라우팅인지
- `camera3` 의 실제 outbound dependency
- 레거시 서비스 간 직접 호출 여부
- `cron` 이 `backend/socket` 과 어떤 방식으로 연결되는지
- `event` 의 WebSocket 송신 여부와 실제 송신 경로
- `packages/common` 내 Kafka / DB / HTTP 관련 실제 사용 서비스 목록
- 현재 문서가 참조하는 운영/레거시 모노레포의 실제 코드 경로 제공 여부
