import { redisClient } from '../config/redis.js';
import { REFRESH_TOKEN_COOKIE_MAX_AGE_MS } from '../constants/jwt.constants.js';

const SESSION_TTL_SECONDS = REFRESH_TOKEN_COOKIE_MAX_AGE_MS / 1000;

function sessionKey(managerAccountId: string): string {
  return `session:${managerAccountId}`;
}

export async function setSession(managerAccountId: string, refreshToken: string): Promise<void> {
  await redisClient.set(sessionKey(managerAccountId), refreshToken, { EX: SESSION_TTL_SECONDS });
}

export async function getSession(managerAccountId: string): Promise<string | null> {
  return redisClient.get(sessionKey(managerAccountId));
}

export async function deleteSession(managerAccountId: string): Promise<void> {
  await redisClient.del(sessionKey(managerAccountId));
}
