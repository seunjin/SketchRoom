/**
 * API 공통 모듈의 public entrypoint입니다.
 *
 * 기능별 API 파일을 추가할 때는 내부 파일 경로를 직접 import하기보다
 * 이 파일에서 export한 값과 타입을 사용하면 import 경로를 안정적으로 유지할 수 있습니다.
 */
export { apiClient } from './client';
export { getApiErrorResponse } from './error';
export type {
  ApiErrorResponse,
  ApiResponse,
  ApiResponseMeta,
} from './types';
