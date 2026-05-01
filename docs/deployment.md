# 배포

SketchRoom은 프론트엔드와 백엔드 서버를 분리해서 배포한다.

## 현재 배포 상태

| 영역 | 플랫폼 | URL |
| --- | --- | --- |
| Web | Vercel | https://sketch-room-web.vercel.app |
| Server | Render | https://sketch-room-server.onrender.com |

서버 health check:

```txt
https://sketch-room-server.onrender.com/health
```

정상 응답:

```json
{
  "status": "ok"
}
```

## Vercel Web

현재 프론트엔드는 Vercel에 배포한다.

설정:

```txt
Root Directory: ./
Framework Preset: Vite
Install Command: pnpm install --frozen-lockfile
Build Command: pnpm --filter @sketch-room/web build
Output Directory: apps/web/dist
```

추후 서버 연동 시 Vercel 환경변수:

```txt
VITE_API_URL=https://sketch-room-server.onrender.com
VITE_WS_URL=wss://sketch-room-server.onrender.com/ws
```

현재 프론트 코드에서는 아직 위 환경변수를 사용하지 않는다.

## Render Server

현재 서버는 Render Node 런타임으로 배포한다.

설정:

```txt
Name: sketch-room-server
Language: Node
Branch: main
Region: Singapore (Southeast Asia)
Root Directory: 비워둠
Build Command: corepack enable && pnpm install --frozen-lockfile && pnpm --filter @sketch-room/server build
Start Command: pnpm --filter @sketch-room/server start:prod
Health Check Path: /health
```

환경변수:

```txt
NODE_ENV=production
WEB_ORIGIN=https://sketch-room-web.vercel.app
DATABASE_URL=<Neon pooled connection string>
```

서버는 TypeORM을 통해 `DATABASE_URL`로 PostgreSQL에 연결한다. DB 스키마 변경은 TypeORM migration으로 관리한다.

`PORT`는 Render가 제공하는 값을 사용한다. 서버 코드는 `process.env.PORT ?? 3000`을 사용한다.

서버는 Render의 public traffic을 받을 수 있도록 `0.0.0.0`에 바인딩한다.

## 서버 Docker

서버용 Dockerfile은 준비되어 있지만 현재 Render 배포에는 사용하지 않는다.

로컬에서 이미지 빌드:

```bash
docker build -f Dockerfile.server -t sketchroom-server .
```

로컬에서 컨테이너 실행:

```bash
docker run --rm -p 3002:3000 \
  --env PORT=3000 \
  --env DATABASE_URL="postgresql://sketchroom:sketchroom@host.docker.internal:15432/sketchroom?schema=public" \
  sketchroom-server
```

Docker 배포 전환은 TypeORM/PostgreSQL 연결 이후 검토한다.

## CI/CD 기준

현재 GitHub Actions는 CI만 담당한다.

- Pull Request 대상이 `main`일 때 `lint`, `build`를 실행한다.
- `main`에 push되면 같은 검증을 한 번 더 실행한다.
- Vercel과 Render는 각 플랫폼의 Git 연동 자동 배포를 사용한다.

Render는 `main`에 변경이 병합되면 자동 배포한다. 가능하면 Render의 Auto-Deploy 설정은 CI 통과 후 배포되는 방식으로 유지한다.

## 운영 DB Migration

운영 DB migration은 자동 배포에 묶지 않고 수동으로 실행한다.

기준 문서:

```txt
docs/database-migrations.md
```

실행 예시:

```bash
DATABASE_URL="<Neon connection string>" pnpm --filter @sketch-room/server migration:run
```

이 명령은 로컬 터미널에서 최신 `main` 코드를 기준으로 실행한다.

실행 후 확인:

```bash
curl https://sketch-room-server.onrender.com/health/db
```

## 추후 정리할 내용

- 채팅/게임 도메인 DB 모델 설계
- WebSocket `wss://` 연결 설정
- Render 무료 인스턴스 cold start 대응
- 프론트엔드와 백엔드 CORS 설정
- Vercel 환경변수 실제 사용 코드 추가
