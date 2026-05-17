# Pull Request 규칙

SketchRoom은 모든 변경을 Pull Request 단위로 관리한다.

## PR 제목

PR 제목은 커밋 컨벤션과 같은 형식을 사용한다.

```txt
<type>(optional scope): <summary>
```

PR 제목의 요약은 한글로 작성한다. 자동 생성 도구나 Codex를 사용하더라도 `[codex]` 같은 작성자 prefix를 붙이지 않는다.

예시:

```txt
feat(server): 웹소켓 게이트웨이 추가
docs(repo): 브랜치와 PR 규칙 문서 추가
```

## PR 설명

PR 설명은 한글로 작성하고 `.github/pull_request_template.md` 템플릿을 따른다.

```md
## 변경 내용
- 

## 확인 방법
- 

## 메모
- 
```

영문 기본 템플릿인 `Summary`, `Validation`만 사용한 PR 설명은 허용하지 않는다.

## PR 크기

- 하나의 PR은 하나의 목적만 가진다.
- 기능 구현과 대규모 리팩터링을 같은 PR에 섞지 않는다.
- 문서가 필요한 변경이면 같은 PR에서 문서를 갱신한다.
- 기능 PR은 기본적으로 `dev`를 base로 생성한다.
- `main` 대상 PR은 production 배포 가능한 변경만 포함한다.
- Codex가 PR을 생성할 때는 명시 요청이 없는 한 draft PR로 생성한다.

## 병합 전 확인

```bash
pnpm lint
pnpm build
```

기능 테스트가 추가된 경우 관련 테스트도 함께 실행한다.

## 자동 검증

GitHub Actions는 PR 제목과 본문에 대해 다음 규칙을 확인한다.

- PR 제목에 `[codex]` prefix가 없어야 한다.
- PR 제목에는 한글 요약이 포함되어야 한다.
- PR 본문에는 `변경 내용`, `확인 방법`, `메모` 섹션이 있어야 한다.

## 리뷰 관점

- 변경 의도가 명확한가
- WebSocket 이벤트 흐름이 예측 가능한가
- 클라이언트와 서버의 타입 계약이 어긋나지 않는가
- 실패 상황이 고려되어 있는가
- 포트폴리오 문서에 남길 기술적 의사결정이 있는가
