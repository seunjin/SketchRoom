# 아키텍처

SketchRoom은 정적 프론트엔드와 장시간 실행되는 백엔드 서버를 분리해서 운영한다.

## 런타임

- `apps/web`: React/Vite 프론트엔드. Vercel에 배포한다.
- `apps/server`: NestJS HTTP/WebSocket 서버. Render에 배포한다.
- PostgreSQL: 로컬은 Docker Compose, 운영은 Neon을 사용한다.

## 서버 모듈 기준

NestJS 서버는 기능 단위 module을 기준으로 나눈다.

```txt
src/
  app.module.ts          # 루트 조립
  database/              # DB 연결, TypeORM 설정, migration 기준
  health/                # 서버/DB 상태 확인 API
```

`AppModule`은 루트 모듈로서 전역 설정과 기능 모듈 조립만 담당한다. HTTP API는 개별 기능 모듈의 controller에 둔다.

TypeORM Entity는 DB 테이블 모델에만 사용한다. 예를 들어 `Room`, `Message`, `User` 같은 도메인 모델은 추후 각 기능 모듈 안에 Entity로 추가한다.

## 현재 상태

상세한 WebSocket 연결 흐름, 채팅방 관리, Canvas 동기화, 데이터 저장 구조는 기능 구현 단계에서 문서화한다.

## 문서화 기준

- 확정된 구조는 `docs/`에 정리한다.
- 작업 중 고민, 시행착오, 의사결정 초안은 `notes/`에 기록한다.
- `notes/` 내용 중 공개 가능한 기술 정리는 추후 `docs/` 또는 `README.md`로 옮긴다.
