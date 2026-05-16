import type { ApiResponseMeta } from '@sketch-room/shared';

export type { ApiResponse, ApiResponseMeta } from '@sketch-room/shared';

export interface ApiResponsePayload<T> {
  data: T;
  code?: string;
  message?: string;
  meta?: ApiResponseMeta;
}
