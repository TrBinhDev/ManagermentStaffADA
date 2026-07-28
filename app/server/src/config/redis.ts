import { createClient } from 'redis';
import { env } from './env.js';

// Tạo một client Redis mới bằng cách sử dụng URL được cung cấp trong biến môi trường. Client này sẽ được sử dụng để kết nối và tương tác với cơ sở dữ liệu Redis.

export const redisClient = createClient({ url: env.REDIS_URL });

redisClient.on('error', (err) => {
  console.error('Redis Client Error', err);
});