import { Message } from '../../constants/message.js';
import { NotFoundError, ConflictError } from '../../errors/AppError.js';
import * as departmentRepository from './department.repository.js';
import type { ListDepartmentQuery, CreateDepartmentInput, UpdateDepartmentInput } from './department.schema.js';

export async function list({ search, page, limit }: ListDepartmentQuery) {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    departmentRepository.findMany(search, skip, limit),
    departmentRepository.count(search),
  ]);

  return { data, total, page, limit };
}

export async function getById(id: string) {
  const department = await departmentRepository.findById(id);
  if (!department) {
    throw new NotFoundError(Message.DEPARTMENT.NOT_FOUND, 'DEPARTMENT_NOT_FOUND');
  }
  return department;
}

export async function create({ name }: CreateDepartmentInput) {
  const existing = await departmentRepository.findByName(name);
  if (existing) {
    throw new ConflictError(Message.DEPARTMENT.NAME_EXISTS, 'DEPARTMENT_NAME_EXISTS');
  }

  return departmentRepository.create(name);
}

export async function update(id: string, { name }: UpdateDepartmentInput) {
  const department = await departmentRepository.findById(id);
  if (!department) {
    throw new NotFoundError(Message.DEPARTMENT.NOT_FOUND, 'DEPARTMENT_NOT_FOUND');
  }

  if (name && name !== department.name) {
    const existing = await departmentRepository.findByName(name);
    if (existing) {
      throw new ConflictError(Message.DEPARTMENT.NAME_EXISTS, 'DEPARTMENT_NAME_EXISTS');
    }
  }

  return departmentRepository.update(id, { name });
}

export async function remove(id: string): Promise<void> {
  const department = await departmentRepository.findById(id);
  if (!department) {
    throw new NotFoundError(Message.DEPARTMENT.NOT_FOUND, 'DEPARTMENT_NOT_FOUND');
  }

  const positionsCount = await departmentRepository.countPositions(id);
  if (positionsCount > 0) {
    throw new ConflictError(Message.DEPARTMENT.HAS_POSITIONS, 'DEPARTMENT_HAS_POSITIONS');
  }

  await departmentRepository.remove(id);
}
