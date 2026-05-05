export type ApiResponseMeta = Record<string, unknown>;

export interface ApiResponse<T> {
  statusCode: number;
  code: string;
  message: string;
  data: T | null;
  meta?: ApiResponseMeta;
}

export interface ApiResponsePayload<T> {
  data: T | null;
  code?: string;
  message?: string;
  meta?: ApiResponseMeta;
}
