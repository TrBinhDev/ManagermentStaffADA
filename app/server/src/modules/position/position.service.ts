import { Message } from '../../constants/message.js';
import { BadRequestError, NotFoundError, ConflictError } from '../../errors/AppError.js';
import * as positionRepository from './position.repository.js';
import type { ListPositionQuery, CreatePositionInput, UpdatePositionInput } from './position.schema.js';

export async function list({ departmentId, search, isActive, page, limit }: ListPositionQuery) {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    positionRepository.findMany(departmentId, search, isActive, skip, limit),
    positionRepository.count(departmentId, search, isActive),
  ]);

  return { data, total, page, limit };
}

export async function getById(id: string) {
  const position = await positionRepository.findById(id);
  if (!position) {
    throw new NotFoundError(Message.POSITION.NOT_FOUND, 'POSITION_NOT_FOUND');
  }
  return position;
}

export async function create({ name, departmentId }: CreatePositionInput) {
  const department = await positionRepository.findDepartmentById(departmentId);
  if (!department) {
    throw new BadRequestError(Message.POSITION.DEPARTMENT_NOT_FOUND, 'DEPARTMENT_NOT_FOUND');
  }

  const existing = await positionRepository.findByNameAndDepartment(name, departmentId);
  if (existing) {
    throw new ConflictError(Message.POSITION.NAME_EXISTS, 'POSITION_NAME_EXISTS');
  }

  return positionRepository.create(name, departmentId);
}

export async function update(id: string, { name, departmentId, isActive }: UpdatePositionInput) {
  const position = await positionRepository.findById(id);
  if (!position) {
    throw new NotFoundError(Message.POSITION.NOT_FOUND, 'POSITION_NOT_FOUND');
  }

  if (departmentId) {
    const department = await positionRepository.findDepartmentById(departmentId);
    if (!department) {
      throw new BadRequestError(Message.POSITION.DEPARTMENT_NOT_FOUND, 'DEPARTMENT_NOT_FOUND');
    }
  }

  const effectiveName = name ?? position.name;
  const effectiveDepartmentId = departmentId ?? position.departmentId;

  if (effectiveName !== position.name || effectiveDepartmentId !== position.departmentId) {
    const existing = await positionRepository.findByNameAndDepartment(effectiveName, effectiveDepartmentId);
    if (existing && existing.id !== id) {
      throw new ConflictError(Message.POSITION.NAME_EXISTS, 'POSITION_NAME_EXISTS');
    }
  }

  return positionRepository.update(id, { name, departmentId, isActive });
}

export async function remove(id: string): Promise<void> {
  const position = await positionRepository.findById(id);
  if (!position) {
    throw new NotFoundError(Message.POSITION.NOT_FOUND, 'POSITION_NOT_FOUND');
  }

  const historyCount = await positionRepository.countPositionHistory(id);
  if (historyCount > 0) {
    throw new ConflictError(Message.POSITION.HAS_EMPLOYEES, 'POSITION_HAS_EMPLOYEES');
  }

  const salaryRateCount = await positionRepository.countSalaryRate(id);
  if (salaryRateCount > 0) {
    throw new ConflictError(Message.POSITION.HAS_SALARY_RATE, 'POSITION_HAS_SALARY_RATE');
  }

  await positionRepository.remove(id);
}
