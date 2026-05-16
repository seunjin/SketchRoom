import { isHTTPError } from 'ky';
import type { ApiErrorResponse } from './types';

/**
 * ky가 던진 에러에서 서버의 공통 에러 envelope를 꺼냅니다.
 *
 * 네트워크 장애, timeout, 예상과 다른 응답 형식은 서버 envelope가 없으므로 undefined를 반환합니다.
 * 호출부에서는 undefined일 때 "잠시 후 다시 시도해 주세요" 같은 일반 메시지를 보여주면 됩니다.
 */
export function getApiErrorResponse(
  error: unknown,
): ApiErrorResponse | undefined {
  /**
   * ky는 4xx/5xx 응답을 HTTPError로 던지고,
   * ky v2는 JSON 응답 본문을 error.data에 미리 파싱해서 넣어줍니다.
   */
  if (!isHTTPError<ApiErrorResponse>(error)) {
    return undefined;
  }

  return isApiErrorResponse(error.data) ? error.data : undefined;
}

/**
 * unknown 값을 서버 에러 envelope로 사용할 수 있는지 런타임에서 확인합니다.
 *
 * TypeScript 타입은 컴파일 타임에만 동작하므로, 외부 API 응답처럼 런타임에서 들어오는 값은
 * 최소한의 shape 검사를 거친 뒤 화면 로직에 넘깁니다.
 */
function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const response = value as Partial<ApiErrorResponse>;

  /**
   * 서버의 HttpExceptionFilter는 에러 응답에서 data를 null로 고정합니다.
   * 이 조건까지 확인하면 일반 객체를 실수로 ApiErrorResponse로 취급할 가능성을 낮출 수 있습니다.
   */
  return (
    typeof response.statusCode === 'number' &&
    typeof response.code === 'string' &&
    typeof response.message === 'string' &&
    response.data === null
  );
}
