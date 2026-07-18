import { Message } from '../../constants/message.js';
import { BadRequestError, NotFoundError, ConflictError } from '../../errors/AppError.js';
import { hashCccd } from '../../utils/hash.util.js';
import { encrypt } from '../../utils/crypto.util.js';
import * as employeeRepository from './employee.repository.js';
import type {
  ListEmployeeQuery,
  CreateEmployeeInput,
  UpdateEmployeeInput,
  RehireEmployeeInput,
} from './employee.schema.js';

export async function list({ status, positionId, departmentId, search, page, limit }: ListEmployeeQuery) {
  const filters = { status, positionId, departmentId, search };
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    employeeRepository.findMany(filters, skip, limit),
    employeeRepository.count(filters),
  ]);

  return { data, total, page, limit };
}

export async function getById(id: string) {
  const employee = await employeeRepository.findById(id);
  if (!employee) {
    throw new NotFoundError(Message.EMPLOYEE.NOT_FOUND, 'EMPLOYEE_NOT_FOUND');
  }
  return employee;
}

export async function create({ cccd, fullName, dob, positionId }: CreateEmployeeInput) {
  const cccdHash = hashCccd(cccd);
  const existing = await employeeRepository.findByCccdHash(cccdHash);

  if (existing) {
    if (existing.status === 'ACTIVE') {
      throw new ConflictError(Message.EMPLOYEE.CCCD_ACTIVE_EXISTS, 'CCCD_ACTIVE_EXISTS');
    }
    throw new ConflictError(Message.EMPLOYEE.CCCD_RESIGNED_EXISTS, 'CCCD_RESIGNED_EXISTS', {
      employeeId: existing.id,
    });
  }

  const position = await employeeRepository.findPositionById(positionId);
  if (!position) {
    throw new BadRequestError(Message.EMPLOYEE.POSITION_NOT_FOUND, 'POSITION_NOT_FOUND');
  }

  const code = await employeeRepository.nextCode();
  const employee = await employeeRepository.create({ code, cccdHash, fullName, dob, positionId });

  const cccdEncrypted = encrypt(cccd);
  await employeeRepository.upsertProfileCccd(employee.id, cccdEncrypted);
  await employeeRepository.createEmploymentPeriod(employee.id);
  await employeeRepository.createPositionHistory(employee.id, positionId);

  return employee;
}

export async function update(id: string, { fullName, dob, positionId }: UpdateEmployeeInput) {
  const employee = await employeeRepository.findById(id);
  if (!employee) {
    throw new NotFoundError(Message.EMPLOYEE.NOT_FOUND, 'EMPLOYEE_NOT_FOUND');
  }

  if (positionId) {
    const position = await employeeRepository.findPositionById(positionId);
    if (!position) {
      throw new BadRequestError(Message.EMPLOYEE.POSITION_NOT_FOUND, 'POSITION_NOT_FOUND');
    }
  }

  const updated = await employeeRepository.update(id, { fullName, dob, positionId });

  if (positionId && positionId !== employee.positionId) {
    await employeeRepository.closeOpenPositionHistory(id);
    await employeeRepository.createPositionHistory(id, positionId);
  }

  return updated;
}

export async function remove(id: string): Promise<void> {
  const employee = await employeeRepository.findById(id);
  if (!employee) {
    throw new NotFoundError(Message.EMPLOYEE.NOT_FOUND, 'EMPLOYEE_NOT_FOUND');
  }

  await employeeRepository.remove(id);
}

export async function resign(id: string) {
  const employee = await employeeRepository.findById(id);
  if (!employee) {
    throw new NotFoundError(Message.EMPLOYEE.NOT_FOUND, 'EMPLOYEE_NOT_FOUND');
  }

  if (employee.status === 'RESIGNED') {
    throw new BadRequestError(Message.EMPLOYEE.ALREADY_RESIGNED, 'ALREADY_RESIGNED');
  }

  const updated = await employeeRepository.updateStatus(id, 'RESIGNED');
  await employeeRepository.closeOpenPositionHistory(id);
  await employeeRepository.closeOpenEmploymentPeriod(id);

  return updated;
}

export async function rehire(id: string, { positionId }: RehireEmployeeInput) {
  const employee = await employeeRepository.findById(id);
  if (!employee) {
    throw new NotFoundError(Message.EMPLOYEE.NOT_FOUND, 'EMPLOYEE_NOT_FOUND');
  }

  if (employee.status !== 'RESIGNED') {
    throw new BadRequestError(Message.EMPLOYEE.NOT_RESIGNED, 'NOT_RESIGNED');
  }

  if (positionId) {
    const position = await employeeRepository.findPositionById(positionId);
    if (!position) {
      throw new BadRequestError(Message.EMPLOYEE.POSITION_NOT_FOUND, 'POSITION_NOT_FOUND');
    }
  }

  const updated = await employeeRepository.updateStatus(id, 'ACTIVE', positionId);
  await employeeRepository.createEmploymentPeriod(id);
  await employeeRepository.createPositionHistory(id, positionId ?? employee.positionId);

  return updated;
}
