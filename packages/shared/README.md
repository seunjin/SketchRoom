# @sketch-room/shared

Shared TypeScript contracts for SketchRoom apps.

This package intentionally contains type-only API contracts. Server runtime
classes such as TypeORM entities and class-validator DTOs should stay in the
server app, while serialized request/response shapes can live here.

## Contract rules

- Add one file per domain, such as `guest.ts`, `room.ts`, or `room-participant.ts`.
- Export only serialized request/response/event shapes from this package.
- Keep validation decorators, TypeORM entities, and framework runtime code inside each app.
- Server DTO classes can `implements` request contracts when that helps keep the API shape aligned.
- Apps should import shared contracts with `import type` or re-export them from feature-local `*.types.ts` files.
- `src/index.ts` is the public type barrel. Subpath type exports are also available for domain-level imports.
