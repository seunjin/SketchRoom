# SketchRoom

SketchRoom is a portfolio project for learning and demonstrating real-time communication with WebSocket.

The project currently has a React/Vite web app, a NestJS server, PostgreSQL connectivity through TypeORM, and basic deployment docs. Chat, canvas synchronization, and WebSocket gameplay features will be added in later milestones.

## Stack

- Web: React, Vite, TypeScript
- Server: NestJS, TypeScript
- Database: PostgreSQL
- ORM: TypeORM
- Package manager: pnpm workspace
- Planned deployment: Vercel for web, Render for server

## Workspace

```txt
apps/
  web/
  server/
packages/
  shared/
docs/
notes/ # local only, ignored by git
```

## Project Documents

- [로컬 개발환경](docs/local-development.md)
- [데이터베이스 마이그레이션 기준](docs/database-migrations.md)
- [브랜치 전략](docs/conventions/branching.md)
- [커밋 컨벤션](docs/conventions/commit.md)
- [Pull Request 규칙](docs/conventions/pull-request.md)
- [로컬 Git Hooks 정책](docs/conventions/local-hooks.md)

## Commands

```bash
pnpm install
pnpm dev:web
pnpm dev:server
pnpm build
pnpm lint
pnpm db:migration:show
```

DB 스키마 변경 기준은 `docs/database-migrations.md`에 정리한다.

## Current Scope

This repository currently contains the runnable workspace, deployment baseline, and database connection baseline. WebSocket features, shared event contracts, and domain persistence are planned for later milestones.
