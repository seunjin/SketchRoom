# 프론트엔드 아키텍처

이 문서는 `apps/web`의 폴더 구조와 API 관리 방식을 정의한다.

SketchRoom 프론트엔드는 TanStack Router, TanStack Query, ky를 사용한다. 구조는 정식 FSD(Feature-Sliced Design)를 그대로 적용하지 않고, 현재 규모에 맞춘 FSD-lite 방식을 사용한다.

## 기본 방향

- route 파일은 TanStack Router의 파일 라우팅 규칙을 따른다.
- 화면에서는 `useQuery`, `useMutation`을 직접 사용한다.
- API 호출 구현은 기능 단위 파일로 분리한다.
- query key는 기능 단위 factory로 관리한다.
- custom query hook은 기본으로 만들지 않는다.
- 공통 인프라는 `shared`에 두고, 도메인별 코드는 `features`에 둔다.

이 방식은 hook wrapper를 과하게 만들지 않으면서도 API 호출 코드와 query key가 화면 곳곳에 흩어지는 것을 막기 위한 절충안이다.

## 목표 폴더 구조

```txt
apps/web/src/
  app/
    query-client.ts
    router.tsx

  routes/
    __root.tsx
    index.tsx

  features/
    health/
      health.api.ts
      health.keys.ts
      health.types.ts
      index.ts

    guest/
      guest.api.ts
      guest.keys.ts
      guest.types.ts
      index.ts

    rooms/
      rooms.api.ts
      rooms.keys.ts
      rooms.types.ts
      index.ts

  shared/
    api/
      client.ts
      error.ts
      types.ts
      index.ts

    lib/
    ui/
```

`entities`, `widgets`, `pages` 레이어는 지금 단계에서는 만들지 않는다. 기능이 커져서 공통 도메인 모델, 복합 화면 블록, 페이지 조립 레이어가 실제로 필요해질 때 추가한다.

## 레이어 책임

### `routes`

TanStack Router의 파일 라우팅 엔트리다.

route 파일은 화면 조립을 담당한다. `useQuery`, `useMutation`은 route 또는 route가 사용하는 컴포넌트에서 직접 작성한다.

```tsx
const healthQuery = useQuery({
  queryKey: healthKeys.status(),
  queryFn: getHealth,
});
```

route 파일에서 직접 `apiClient`를 호출하지 않는다. API 호출은 `features/*/*.api.ts`에 둔다.

### `features`

기능 단위 코드의 기본 위치다.

각 feature는 처음에는 아래 파일만 둔다.

```txt
{name}.api.ts
{name}.keys.ts
{name}.types.ts
index.ts
```

- `*.api.ts`: ky 기반 API 함수만 둔다.
- `*.keys.ts`: TanStack Query query key factory만 둔다.
- `*.types.ts`: request/response 타입만 둔다.
- `index.ts`: 해당 feature의 public API만 다시 export한다.

feature 내부에 UI 컴포넌트가 필요해지면 그때 `components/`를 추가한다.

### `shared`

여러 feature가 같이 쓰는 공통 코드다.

`shared/api`는 HTTP transport와 공통 응답 타입만 담당한다. guest id, room id 같은 도메인 지식은 넣지 않는다.

## API 함수 규칙

API 함수는 순수 async 함수로 작성한다. React Query hook을 감싸지 않는다.

```ts
export async function getHealth() {
  const response = await apiClient
    .get("health")
    .json<ApiResponse<HealthResponse>>();

  return response.data;
}
```

화면에서는 API 함수와 query key를 조합해서 직접 사용한다.

```tsx
const healthQuery = useQuery({
  queryKey: healthKeys.status(),
  queryFn: getHealth,
});
```

이렇게 하면 호출부에서 `enabled`, `staleTime`, `retry`, `select` 같은 옵션을 자유롭게 조절할 수 있다.

## `ApiResponse<T>` 규칙

공통 응답 envelope는 하나만 사용한다.

```ts
export interface ApiResponse<T> {
  statusCode: number;
  code: string;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
}
```

`data`가 nullable인지 여부는 공통 타입이 아니라 endpoint별 타입으로 표현한다.

```ts
ApiResponse<Room[]>        // 목록 조회: 없으면 []
ApiResponse<Room>          // 단건 조회 성공
ApiResponse<null>          // 반환할 데이터가 없는 성공
ApiResponse<Room | null>   // null이 정상 의미를 갖는 endpoint
```

서버 API는 endpoint별로 `data`의 의미를 명확히 보장해야 한다. 예를 들어 목록 조회는 결과가 없을 때 `null`이 아니라 빈 배열 `[]`을 내려준다.

## Query Key 규칙

query key는 feature별 factory로 관리한다.

```ts
export const healthKeys = {
  all: ["health"] as const,
  status: () => [...healthKeys.all, "status"] as const,
};
```

목록과 상세가 있는 feature는 아래 형태를 기본으로 한다.

```ts
export const roomKeys = {
  all: ["rooms"] as const,
  lists: () => [...roomKeys.all, "list"] as const,
  list: (filters: RoomListFilters) => [...roomKeys.lists(), filters] as const,
  details: () => [...roomKeys.all, "detail"] as const,
  detail: (roomId: string) => [...roomKeys.details(), roomId] as const,
};
```

필터 객체를 key에 넣을 때는 undefined와 기본값 처리 기준을 API 함수와 맞춘다.

## Barrel 파일 규칙

barrel 파일은 feature 또는 shared 하위 모듈의 public API를 제한하는 용도로만 사용한다.

허용한다.

```txt
features/rooms/index.ts
shared/api/index.ts
```

피한다.

```txt
src/index.ts
features/index.ts
shared/index.ts
```

전역 barrel은 의존 방향을 숨기고 순환 참조를 만들기 쉬우므로 사용하지 않는다.

## Import 규칙

- route는 feature의 public API에서 가져온다.
- feature는 `shared`를 사용할 수 있다.
- `shared`는 feature나 route를 import하지 않는다.
- feature끼리 직접 import하는 것은 기본적으로 피한다.

예시:

```ts
import { getHealth, healthKeys } from "../features/health";
import { apiClient, type ApiResponse } from "../../shared/api";
```

## 적용 순서

1. `src/lib/api`를 `src/shared/api`로 이동한다.
2. `src/lib/query-client.ts`, `src/router.tsx`를 `src/app`으로 이동한다.
3. `features/health`를 만들고 현재 health 호출을 `health.api.ts`, `health.keys.ts`, `health.types.ts`로 분리한다.
4. `ApiResponse<T>`의 `data`를 `T | null`에서 `T`로 정리한다.
5. 이후 guest, rooms, participants API를 같은 규칙으로 추가한다.
