export const RESPONSE_CODE = {
  SUCCESS: 'SUCCESS',
} as const;

export type ResponseCode = (typeof RESPONSE_CODE)[keyof typeof RESPONSE_CODE];
