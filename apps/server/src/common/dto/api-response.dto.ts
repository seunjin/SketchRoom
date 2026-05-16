export type ApiResponseMeta = Record<string, unknown>;

export interface ApiResponse<T> {
  statusCode: number;
  code: string;
  message: string;
  data: T;
  meta?: ApiResponseMeta;
}

export interface ApiResponsePayload<T> {
  data: T;
  code?: string;
  message?: string;
  meta?: ApiResponseMeta;
}
