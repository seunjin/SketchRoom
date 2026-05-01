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
```

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
