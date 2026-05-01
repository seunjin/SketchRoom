# 배포

초기 워크스페이스 단계에서는 배포 설정을 포함하지 않는다.

## 예정 배포 대상

- Web: Vercel
- Server: Render Docker Web Service
- Database: PostgreSQL

## 서버 Docker

서버는 루트의 `Dockerfile.server`를 사용한다.

로컬에서 이미지 빌드:

```bash
docker build -f Dockerfile.server -t sketchroom-server .
```

로컬에서 컨테이너 실행:

```bash
docker run --rm -p 3000:3000 --env PORT=3000 sketchroom-server
```

Render에서는 Dockerfile 경로를 `Dockerfile.server`로 지정한다.

## 추후 정리할 내용

- 환경 변수 관리
- WebSocket `wss://` 연결 설정
- Render 무료 인스턴스 cold start 대응
- 프론트엔드와 백엔드 CORS 설정
- Vercel 환경 변수와 API 서버 URL 분리
- 배포 후 헬스 체크 방식
