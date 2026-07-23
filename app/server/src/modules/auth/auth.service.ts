import bcrypt from 'bcrypt';
import { Message } from '../../constants/message.js';
import { UnauthorizedError } from '../../errors/AppError.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/token.util.js';
import { setSession, getSession, deleteSession } from '../../utils/session.util.js';
import * as authRepository from './auth.repository.js';
import type { LoginInput, ChangePasswordInput } from './auth.schema.js';

const BCRYPT_ROUNDS = 10;

export async function login({ email, password }: LoginInput) {
  const account = await authRepository.findByEmail(email);

  if (!account || !account.isActive) {
    throw new UnauthorizedError(Message.AUTH.LOCKED_ACCOUNT, 'INVALID_CREDENTIALS');
  }

  const passwordMatches = await bcrypt.compare(password, account.passwordHash);
  if (!passwordMatches) {
    throw new UnauthorizedError(Message.AUTH.INVALID_CREDENTIALS, 'INVALID_CREDENTIALS');
  }

  const accessToken = signAccessToken({ managerAccountId: account.id, role: account.role, employeeId: account.employeeId });
  const refreshToken = signRefreshToken({ managerAccountId: account.id, role: account.role, employeeId: account.employeeId });
  await setSession(account.id, refreshToken);

  return { accessToken, refreshToken, role: account.role };
}

export async function refreshSession(refreshToken: string | undefined) {
  if (!refreshToken) {
    throw new UnauthorizedError(Message.COMMON.UNAUTHORIZED, 'MISSING_REFRESH_TOKEN');
  }

  const payload = verifyRefreshToken(refreshToken);

  const storedToken = await getSession(payload.managerAccountId);
  if (!storedToken || storedToken !== refreshToken) {
    throw new UnauthorizedError(Message.COMMON.UNAUTHORIZED, 'SESSION_EXPIRED');
  }

  const accessToken = signAccessToken({ managerAccountId: payload.managerAccountId, role: payload.role, employeeId: payload.employeeId });
  const newRefreshToken = signRefreshToken({ managerAccountId: payload.managerAccountId, role: payload.role, employeeId: payload.employeeId });
  await setSession(payload.managerAccountId, newRefreshToken);

  return { accessToken, refreshToken: newRefreshToken };
}

export async function logout(managerAccountId: string): Promise<void> {
  await deleteSession(managerAccountId);
}

export async function getMe(managerAccountId: string) {
  const account = await authRepository.findMeById(managerAccountId);

  if (!account) {
    throw new UnauthorizedError(Message.COMMON.UNAUTHORIZED, 'ACCOUNT_NOT_FOUND');
  }

  return account;
}

export async function changePassword(
  managerAccountId: string,
  { oldPassword, newPassword }: ChangePasswordInput,
): Promise<void> {
  const account = await authRepository.findById(managerAccountId);

  if (!account) {
    throw new UnauthorizedError(Message.COMMON.UNAUTHORIZED, 'ACCOUNT_NOT_FOUND');
  }

  const oldPasswordMatches = await bcrypt.compare(oldPassword, account.passwordHash);
  if (!oldPasswordMatches) {
    throw new UnauthorizedError(Message.AUTH.INVALID_OLD_PASSWORD, 'INVALID_OLD_PASSWORD');
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await authRepository.updatePasswordHash(managerAccountId, passwordHash);
}
