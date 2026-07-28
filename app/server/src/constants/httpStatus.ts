// File này chứa các hằng số HTTP status code được sử dụng trong ứng dụng. Các hằng số này giúp mã hóa và giải mã các trạng thái HTTP một cách dễ dàng và rõ ràng hơn, giúp cải thiện khả năng đọc và bảo trì mã nguồn.

export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  PAYLOAD_TOO_LARGE: 413,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export type HttpStatusCode = (typeof HttpStatus)[keyof typeof HttpStatus];
