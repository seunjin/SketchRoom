# 브랜치 전략

SketchRoom은 포트폴리오 프로젝트이지만, 실제 협업 프로젝트처럼 작업 단위를 분리하고 Pull Request 기준으로 변경을 관리한다.

## 기본 원칙

- `main` 브랜치는 항상 배포 가능한 상태를 유지한다.
- 모든 기능, 수정, 문서 작업은 작업 브랜치를 만든 뒤 PR로 병합한다.
- 하나의 브랜치는 하나의 목적만 가진다.
- PR은 작게 유지하고, 리뷰하기 쉬운 단위로 나눈다.

## 브랜치 종류

```txt
main
dev
feature/*
fix/*
docs/*
chore/*
refactor/*
test/*
ci/*
```

## 브랜치 네이밍

```txt
<type>/<short-description>
```

예시:

```txt
feature/websocket-gateway
feature/room-chat
feature/canvas-sync
fix/reconnect-loop
docs/branching-strategy
chore/setup-docker
```

## 작업 흐름

1. 최신 `dev`를 기준으로 작업 브랜치를 만든다.
2. 작업 브랜치에서 기능을 구현한다.
3. 로컬에서 `lint`, `build`, 필요한 테스트를 실행한다.
4. GitHub에 브랜치를 push한다.
5. `dev`를 base로 Pull Request를 생성한다.
6. PR 설명에 변경 내용, 확인 방법, 남은 이슈를 적는다.
7. 기능 PR이 안정적이면 `dev`로 병합한다.
8. 배포 가능한 단위가 되면 `dev`에서 `main`으로 PR을 생성한다.

## 브랜치 역할

- `main`: production 배포 브랜치
- `dev`: 개발 통합 브랜치
- 작업 브랜치: 기능, 수정, 문서 단위 변경 브랜치

## 병합 기준

- 빌드가 성공해야 한다.
- lint 에러가 없어야 한다.
- PR 설명만 보고 변경 의도를 이해할 수 있어야 한다.
- 관련 문서가 필요한 변경이면 문서도 함께 갱신한다.
