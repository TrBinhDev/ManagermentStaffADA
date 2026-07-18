import { Message } from '../../constants/message.js';
import { BadRequestError, NotFoundError, ConflictError } from '../../errors/AppError.js';
import { hashCccd } from '../../utils/hash.util.js';
import { encrypt, decrypt } from '../../utils/crypto.util.js';
import * as employeeProfileRepository from './employee-profile.repository.js';
import type { UpsertEmployeeProfileInput } from './employee-profile.schema.js';

function toResponse(profile: { cccdEncrypted: string; [key: string]: unknown }) {
  const { cccdEncrypted, ...rest } = profile;
  return { ...rest, cccd: decrypt(cccdEncrypted) };
}

export async function getProfile(employeeId: string) {
  const employee = await employeeProfileRepository.findEmployeeById(employeeId);
  if (!employee) {
    throw new NotFoundError(Message.EMPLOYEE.NOT_FOUND, 'EMPLOYEE_NOT_FOUND');
  }

  const profile = await employeeProfileRepository.findByEmployeeId(employeeId);
  if (!profile) {
    return null;
  }

  return toResponse(profile);
}

export async function upsertProfile(employeeId: string, input: UpsertEmployeeProfileInput) {
  const employee = await employeeProfileRepository.findEmployeeById(employeeId);
  if (!employee) {
    throw new NotFoundError(Message.EMPLOYEE.NOT_FOUND, 'EMPLOYEE_NOT_FOUND');
  }

  const { cccd, ...rest } = input;
  let cccdEncrypted: string | undefined;

  if (cccd) {
    const newHash = hashCccd(cccd);
    const conflicting = await employeeProfileRepository.findEmployeeByCccdHash(newHash);

    if (conflicting && conflicting.id !== employeeId) {
      if (conflicting.status === 'ACTIVE') {
        throw new ConflictError(Message.EMPLOYEE.CCCD_ACTIVE_EXISTS, 'CCCD_ACTIVE_EXISTS');
      }
      throw new ConflictError(Message.EMPLOYEE.CCCD_RESIGNED_EXISTS, 'CCCD_RESIGNED_EXISTS', {
        employeeId: conflicting.id,
      });
    }

    cccdEncrypted = encrypt(cccd);
    await employeeProfileRepository.updateEmployeeCccdHash(employeeId, newHash);
  }

  const existingProfile = await employeeProfileRepository.findByEmployeeId(employeeId);

  if (!existingProfile) {
    if (!cccdEncrypted) {
      throw new BadRequestError(Message.EMPLOYEE_PROFILE.CCCD_REQUIRED, 'CCCD_REQUIRED');
    }
    await employeeProfileRepository.create(employeeId, cccdEncrypted, rest);
  } else {
    await employeeProfileRepository.update(employeeId, { ...rest, ...(cccdEncrypted ? { cccdEncrypted } : {}) });
  }

  return getProfile(employeeId);
}
