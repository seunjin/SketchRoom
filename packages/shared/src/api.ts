export type ApiResponseMeta = Record<string, unknown>;

export interface ApiResponse<T> {
  statusCode: number;
  code: string;
  message: string;
  data: T;
  meta?: ApiResponseMeta;
}

export type ApiErrorResponse = ApiResponse<null>;
