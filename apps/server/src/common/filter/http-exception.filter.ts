import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiResponse, ApiResponseMeta } from '../dto/api-response.dto';
import { ERROR_CODE, ErrorCode } from '../constant/error-code.constant';
import { ERROR_MESSAGE } from '../constant/error-message.constant';

interface ExceptionResponseBody {
  code?: unknown;
  message?: unknown;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const statusCode = this.getStatusCode(exception);
    const exceptionResponse = this.getExceptionResponse(exception);
    const code = this.getCode(statusCode, exceptionResponse);
    const { message, meta } = this.getMessageAndMeta(code, exceptionResponse);

    const body: ApiResponse<null> = {
      statusCode,
      code,
      message,
      data: null,
      ...(meta ? { meta } : {}),
    };

    response.status(statusCode).json(body);
  }

  private getStatusCode(exception: unknown): HttpStatus {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private getExceptionResponse(
    exception: unknown,
  ): ExceptionResponseBody | undefined {
    if (!(exception instanceof HttpException)) {
      return undefined;
    }

    const response = exception.getResponse();

    if (typeof response === 'string') {
      return { message: response };
    }

    if (typeof response === 'object' && response !== null) {
      return response;
    }

    return undefined;
  }

  private getCode(
    statusCode: HttpStatus,
    exceptionResponse?: ExceptionResponseBody,
  ): ErrorCode {
    if (
      typeof exceptionResponse?.code === 'string' &&
      this.isErrorCode(exceptionResponse.code)
    ) {
      return exceptionResponse.code;
    }

    if (
      statusCode === HttpStatus.BAD_REQUEST &&
      Array.isArray(exceptionResponse?.message)
    ) {
      return ERROR_CODE.VALIDATION_ERROR;
    }

    switch (statusCode) {
      case HttpStatus.BAD_REQUEST:
        return ERROR_CODE.BAD_REQUEST;
      case HttpStatus.FORBIDDEN:
        return ERROR_CODE.FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return ERROR_CODE.NOT_FOUND;
      case HttpStatus.CONFLICT:
        return ERROR_CODE.CONFLICT;
      default:
        return ERROR_CODE.INTERNAL_SERVER_ERROR;
    }
  }

  private getMessageAndMeta(
    code: ErrorCode,
    exceptionResponse?: ExceptionResponseBody,
  ): { message: string; meta?: ApiResponseMeta } {
    if (Array.isArray(exceptionResponse?.message)) {
      return {
        message: ERROR_MESSAGE[code],
        meta: {
          errors: exceptionResponse.message,
        },
      };
    }

    if (typeof exceptionResponse?.message === 'string') {
      return {
        message: exceptionResponse.message,
      };
    }

    return {
      message: ERROR_MESSAGE[code],
    };
  }

  private isErrorCode(code: string): code is ErrorCode {
    return Object.values(ERROR_CODE).includes(code as ErrorCode);
  }
}
