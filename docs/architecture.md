# 아키텍처

SketchRoom은 정적 프론트엔드와 장시간 실행되는 백엔드 서버를 분리해서 운영한다.

## 예정 런타임

- `apps/web`: React/Vite 프론트엔드. Vercel 배포 예정.
- `apps/server`: NestJS HTTP/WebSocket 서버. Render 배포 예정.
- PostgreSQL: 관리형 데이터베이스 사용 예정.

## 현재 상태

현재는 초기 워크스페이스만 구성된 상태다.

상세한 WebSocket 연결 흐름, 채팅방 관리, Canvas 동기화, 데이터 저장 구조는 기능 구현 단계에서 문서화한다.

## 문서화 기준

- 확정된 구조는 `docs/`에 정리한다.
- 작업 중 고민, 시행착오, 의사결정 초안은 `notes/`에 기록한다.
- `notes/` 내용 중 공개 가능한 기술 정리는 추후 `docs/` 또는 `README.md`로 옮긴다.
