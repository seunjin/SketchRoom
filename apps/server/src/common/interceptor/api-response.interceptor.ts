import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import type { Response } from 'express';
import { ApiResponse, ApiResponsePayload } from '../dto/api-response.dto';
import { RESPONSE_CODE } from '../constant/response-code.constant';
import { RESPONSE_MESSAGE } from '../constant/response-message.constant';

@Injectable()
export class ApiResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T>> {
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((data) => {
        const payload = this.toPayload(data);

        return {
          statusCode: response.statusCode,
          code: payload.code ?? RESPONSE_CODE.SUCCESS,
          message: payload.message ?? RESPONSE_MESSAGE.SUCCESS,
          data: payload.data,
          ...(payload.meta ? { meta: payload.meta } : {}),
        };
      }),
    );
  }

  private toPayload(data: T): ApiResponsePayload<T> {
    if (this.isApiResponsePayload(data)) {
      return data;
    }

    return {
      data: data === undefined ? null : data,
    };
  }

  private isApiResponsePayload(data: T): data is T & ApiResponsePayload<T> {
    if (typeof data !== 'object' || data === null || !('data' in data)) {
      return false;
    }

    return 'meta' in data || 'code' in data || 'message' in data;
  }
}
