# 데이터베이스 마이그레이션 기준

SketchRoom은 TypeORM migration으로 PostgreSQL 스키마 변경 이력을 관리한다.

## 기본 원칙

- 로컬과 운영 모두 `synchronize: false`를 유지한다.
- Entity 변경이 있으면 migration 파일을 같은 PR에 포함한다.
- 생성된 migration은 실행 전 반드시 직접 읽고 의도한 SQL인지 확인한다.
- 이미 운영 DB에 반영된 migration 파일은 수정하지 않는다.
- 운영에 반영된 migration을 되돌리거나 고쳐야 하면 새 migration을 만든다.
- 복잡한 변경은 여러 migration으로 나눠서 적용한다.

## 파일 위치

```txt
apps/server/src/database/migrations/
```

예시:

```txt
apps/server/src/database/migrations/
  1760000000000-CreateUsers.ts
  1760000001000-CreateRooms.ts
  1760000002000-CreateMessages.ts
```

## 로컬 작업 흐름

1. 로컬 PostgreSQL을 실행한다.
2. Entity를 작성하거나 수정한다.
3. TypeORM CLI로 migration을 생성한다.
4. 생성된 migration의 `up`, `down` 내용을 검토한다.
5. 로컬 DB에 migration을 실행한다.
6. 서버를 실행하고 기능을 확인한다.
7. Entity와 migration 파일을 함께 커밋한다.

## 명령어

로컬 PostgreSQL 실행:

```bash
docker compose up -d postgres
```

현재 migration 상태 확인:

```bash
pnpm db:migration:show
```

로컬 개발용 자동 흐름:

```bash
pnpm db:migration:dev AddRoomParticipant
```

이 명령은 다음 작업을 순서대로 실행한다.

```txt
1. migration 생성
2. 생성된 migration 파일 prettier 포맷
3. 로컬 DB에 migration 실행
4. migration 적용 상태 확인
```

생성된 migration은 자동 실행 후에도 반드시 직접 읽고 PR에 포함한다.

Entity 변경분으로 migration 생성:

```bash
pnpm db:migration:generate src/database/migrations/CreateUsers
```

빈 migration 파일 생성:

```bash
pnpm db:migration:create src/database/migrations/CreateUsers
```

Migration 실행:

```bash
pnpm db:migration:run
```

마지막 migration 되돌리기:

```bash
pnpm db:migration:revert
```

## 운영 적용 기준

운영 DB는 Neon PostgreSQL을 사용한다. 운영 migration은 자동 배포에 묶지 않고 수동으로 실행한다.

권장 흐름:

1. PR에서 migration 파일을 리뷰한다.
2. `main`에 머지한다.
3. 운영 배포 상태를 확인한다.
4. 운영 `DATABASE_URL`을 대상으로 migration을 실행한다.
5. `/health/db`로 DB 연결 상태를 확인한다.

운영 DB migration 실행은 로컬 터미널에서 최신 `main` 코드를 기준으로 운영 `DATABASE_URL`을 명시해서 수행한다.

```bash
DATABASE_URL="<Neon connection string>" pnpm --filter @sketch-room/server migration:run
```

## 변경 유형별 기준

새 테이블 추가:

- migration과 서버 배포 순서에 대한 위험이 낮다.

새 nullable 컬럼 추가:

- 기존 데이터가 있어도 안전하다.

새 `NOT NULL` 컬럼 추가:

- 바로 추가하지 않는다.
- nullable 컬럼 추가, 기존 데이터 채우기, `NOT NULL` 변경을 나눠서 진행한다.

컬럼 삭제:

- 먼저 서버 코드에서 해당 컬럼 사용을 제거한다.
- 배포 후 별도 migration으로 컬럼을 삭제한다.

컬럼 이름 변경:

- 자동 생성 결과를 그대로 믿지 않는다.
- 데이터 보존이 필요한지 확인하고 직접 migration을 검토한다.

## PR 체크리스트

- Entity 변경과 migration 파일이 같이 포함되어 있는가?
- `up`과 `down`이 의도대로 작성되어 있는가?
- 로컬 DB에서 `pnpm db:migration:run`을 실행했는가?
- `pnpm lint`, `pnpm build`가 성공했는가?
- 운영 DB에 바로 위험한 변경은 없는가?
