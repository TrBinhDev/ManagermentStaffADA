// File này chứa các hằng số liên quan đến JWT (JSON Web Token) được sử dụng trong ứng dụng. Các hằng số này giúp quản lý thời gian hết hạn của token và tên cookie lưu trữ refresh token một cách dễ dàng và rõ ràng hơn, giúp cải thiện khả năng đọc và bảo trì mã nguồn.

export const JWT_ACCESS_EXPIRES_IN = '15m';
export const JWT_REFRESH_EXPIRES_IN = '7d';

export const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken';
export const REFRESH_TOKEN_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;