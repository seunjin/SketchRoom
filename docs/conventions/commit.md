# 커밋 컨벤션

SketchRoom은 Conventional Commits 형식을 가볍게 적용한다.

## 형식

```txt
<type>(optional scope): <summary>
```

예시:

```txt
chore(repo): 초기 워크스페이스 구성
feat(server): 웹소켓 게이트웨이 추가
fix(web): 재연결 상태 처리 수정
docs(repo): 브랜치 전략 문서 추가
refactor(shared): 웹소켓 이벤트 타입 분리
test(server): 채팅방 브로드캐스트 테스트 추가
```

## 타입

- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서 변경
- `style`: 포맷팅, 스타일 변경
- `refactor`: 동작 변경 없는 구조 개선
- `test`: 테스트 추가 또는 수정
- `chore`: 설정, 도구, 의존성, 저장소 관리
- `build`: 빌드 설정 변경
- `ci`: CI/CD 설정 변경

## 스코프

스코프는 변경 영역을 명확히 할 때 사용한다.

- `web`
- `server`
- `shared`
- `repo`
- `docs`

## 작성 규칙

- 커밋 메시지의 `type`과 `scope`는 영어로 작성한다.
- `summary`는 한글로 작성한다.
- `summary`는 변경 내용을 짧고 명확하게 설명한다.
- summary 끝에는 마침표를 찍지 않는다.
- 가능하면 72자 이내로 작성한다.
- 한 커밋은 하나의 논리적 변경만 담는다.
- 본문이 필요한 경우 한글로 작성한다.

## 권장 예시

```txt
feat(server): 채팅방 입장 핸들러 추가
fix(web): 중복 소켓 연결 방지
docs(docs): PR 작업 흐름 문서 추가
chore(repo): pnpm 워크스페이스 설정
```
