import { ERROR_CODE } from './error-code.constant';

export const ERROR_MESSAGE = {
  [ERROR_CODE.VALIDATION_ERROR]: '입력값을 확인해 주세요.',
  [ERROR_CODE.BAD_REQUEST]: '요청 내용을 확인해 주세요.',
  [ERROR_CODE.FORBIDDEN]: '요청을 처리할 권한이 없습니다.',
  [ERROR_CODE.NOT_FOUND]: '요청한 정보를 찾을 수 없습니다.',
  [ERROR_CODE.CONFLICT]: '요청한 작업을 처리할 수 없습니다.',
  [ERROR_CODE.INTERNAL_SERVER_ERROR]:
    '일시적인 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.',

  [ERROR_CODE.GUEST_NOT_FOUND]: '게스트 정보를 찾을 수 없습니다.',
  [ERROR_CODE.GUEST_DISPLAY_CODE_GENERATION_FAILED]:
    '게스트 코드를 생성하지 못했습니다. 다시 시도해 주세요.',

  [ERROR_CODE.ROOM_NOT_FOUND]: '방을 찾을 수 없습니다.',
  [ERROR_CODE.ROOM_PASSWORD_REQUIRED]: '비밀번호를 입력해 주세요.',
  [ERROR_CODE.ROOM_PASSWORD_INVALID]: '비밀번호를 다시 확인해 주세요.',
  [ERROR_CODE.ROOM_HOST_ONLY]: '방장만 변경할 수 있습니다.',
  [ERROR_CODE.ROOM_FULL]: '방이 가득 찼습니다.',

  [ERROR_CODE.ROOM_PARTICIPANT_NOT_FOUND]:
    '방에 참여 중인 정보를 찾을 수 없습니다.',
  [ERROR_CODE.ALREADY_JOINED_ROOM]: '이미 참여 중인 방이 있습니다.',
} as const;
