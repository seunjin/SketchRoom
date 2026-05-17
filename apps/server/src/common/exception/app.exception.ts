import { HttpException, HttpStatus } from '@nestjs/common';
import { ERROR_MESSAGE } from '../constant/error-message.constant';
import { ErrorCode } from '../constant/error-code.constant';

export class AppException extends HttpException {
  constructor(
    code: ErrorCode,
    statusCode: HttpStatus,
    message = ERROR_MESSAGE[code],
  ) {
    super({ code, message }, statusCode);
  }
}
