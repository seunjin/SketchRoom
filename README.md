# SketchRoom

SketchRoom is a portfolio project for learning and demonstrating real-time communication with WebSocket.

The first milestone is a minimal monorepo workspace with a React/Vite web app and a NestJS server. Chat, canvas synchronization, database integration, Docker, CI/CD, and deployment setup will be added in later milestones.

## Stack

- Web: React, Vite, TypeScript
- Server: NestJS, TypeScript
- Package manager: pnpm workspace
- Planned database: PostgreSQL
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
```

## Current Scope

This repository currently contains only the initial runnable workspace setup. WebSocket features, shared event contracts, persistence, Docker, and CI/CD are intentionally out of scope for this step.
