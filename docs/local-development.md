# 로컬 개발환경

이 문서는 SketchRoom을 로컬에서 실행하기 위한 기본 규칙을 정리한다.

현재 단계에서는 React/Vite 앱, NestJS 서버, 로컬 PostgreSQL 컨테이너를 실행한다. TypeORM은 서버의 DB 연결 확인에 사용하고, WebSocket 기능 연결은 이후 단계에서 추가한다.

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

## 로컬 PostgreSQL

PostgreSQL은 Docker Compose로 실행한다.

```bash
docker compose up -d postgres
```

상태 확인:

```bash
docker compose ps
```

종료:

```bash
docker compose down
```

데이터까지 삭제:

```bash
docker compose down -v
```

기본 연결 정보:

```txt
host: localhost
port: 15432
database: sketchroom
user: sketchroom
password: sketchroom
```

`docker-compose.yml`은 호스트 포트 `15432`를 컨테이너 내부 PostgreSQL 기본 포트 `5432`로 연결한다.

```txt
localhost:15432 -> postgres:5432
```

`DATABASE_URL`:

```txt
postgresql://sketchroom:sketchroom@localhost:15432/sketchroom?schema=public
```

DB 연결 확인:

```bash
curl http://localhost:3000/health/db
```

정상 응답:

```json
{
  "status": "ok"
}
```

DB 연결은 NestJS `TypeOrmModule`과 `DATABASE_URL` 환경변수를 사용한다. 스키마 변경은 TypeORM migration으로 관리한다.

## TypeORM Migration

마이그레이션 기준은 `docs/database-migrations.md`를 따른다.

현재 migration 상태 확인:

```bash
pnpm db:migration:show
```

Entity 변경분으로 migration 생성:

```bash
pnpm db:migration:generate src/database/migrations/CreateUsers
```

Migration 실행:

```bash
pnpm db:migration:run
```

Migration 되돌리기:

```bash
pnpm db:migration:revert
```

로컬과 운영 모두 `synchronize: false`를 유지한다. Entity 변경이 있으면 migration 파일을 같은 PR에 포함한다.

## 검증

```bash
pnpm lint
pnpm build
```

## 로컬 개발 원칙

- 프론트와 서버는 기본적으로 `pnpm dev:*` 명령으로 실행한다.
- 데이터베이스, Redis 같은 외부 의존성만 Docker로 실행한다.
- Docker 기반 서버 실행은 배포 검증용으로만 사용한다.
- 개인 작업 로그와 시행착오는 `notes/`에 기록하고 Git에는 올리지 않는다.
