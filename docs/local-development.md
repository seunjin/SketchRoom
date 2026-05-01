# 로컬 개발환경

이 문서는 SketchRoom을 로컬에서 실행하기 위한 기본 규칙을 정리한다.

현재 단계에서는 React/Vite 앱과 NestJS 서버만 실행한다. PostgreSQL, Prisma, Docker, WebSocket 기능 연결은 이후 단계에서 추가한다.

## 요구사항

- Node.js 22
- pnpm 10.19.0

버전 기준은 루트의 `.nvmrc`와 `package.json`의 `packageManager`를 따른다.

## 설치

```bash
pnpm install
```

## 환경변수

각 예시 파일을 복사해서 로컬 환경 파일을 만든다.

```bash
cp .env.example .env
cp apps/web/.env.example apps/web/.env
cp apps/server/.env.example apps/server/.env
```

`.env` 파일은 Git에 올리지 않는다.

## 실행

프론트엔드:

```bash
pnpm dev:web
```

기본 주소:

```txt
http://localhost:5173
```

백엔드:

```bash
pnpm dev:server
```

기본 주소:

```txt
http://localhost:3000
```

## 검증

```bash
pnpm lint
pnpm build
```

## 로컬 개발 원칙

- 프론트와 서버는 기본적으로 `pnpm dev:*` 명령으로 실행한다.
- 데이터베이스, Redis 같은 외부 의존성만 Docker로 실행한다.
- Docker 기반 서버 실행은 배포 구조를 잡는 단계에서 별도 문서로 추가한다.
- 개인 작업 로그와 시행착오는 `notes/`에 기록하고 Git에는 올리지 않는다.
