/**
 * 서버 응답의 부가 정보 영역입니다.
 *
 * 현재 서버는 validation error처럼 추가 설명이 필요한 경우에만 meta를 내려줍니다.
 * endpoint마다 meta 구조가 달라질 수 있으므로 공통 타입에서는 좁히지 않고 둡니다.
 */
export type ApiResponseMeta = Record<string, unknown>;

/**
 * Nest 서버의 전역 ApiResponseInterceptor/HttpExceptionFilter가 내려주는 공통 응답 형식입니다.
 *
 * 성공과 실패 모두 같은 envelope를 사용합니다.
 * 성공 응답에서는 data에 실제 payload가 들어가고,
 * 에러 응답에서는 data가 null이며 code/message로 실패 이유를 구분합니다.
 */
export interface ApiResponse<T> {
  statusCode: number;
  code: string;
  message: string;
  data: T | null;
  meta?: ApiResponseMeta;
}

/**
 * 서버 에러 응답은 항상 data가 null인 ApiResponse입니다.
 *
 * ky의 HTTPError.data에서 서버 envelope를 꺼낼 때 사용하는 타입입니다.
 */
export type ApiErrorResponse = ApiResponse<null>;
