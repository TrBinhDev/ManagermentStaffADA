import { Message } from '../../constants/message.js';
import { NotFoundError, ConflictError } from '../../errors/AppError.js';
import * as shiftRepository from './shift.repository.js';
import type { ListShiftQuery, CreateShiftInput, UpdateShiftInput } from './shift.schema.js';

export async function list({ isActive, page, limit }: ListShiftQuery) {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    shiftRepository.findMany(isActive, skip, limit),
    shiftRepository.count(isActive),
  ]);

  return { data, total, page, limit };
}

export async function getById(id: string) {
  const shift = await shiftRepository.findById(id);
  if (!shift) {
    throw new NotFoundError(Message.SHIFT.NOT_FOUND, 'SHIFT_NOT_FOUND');
  }
  return shift;
}

export async function create({ name, startTime, endTime }: CreateShiftInput) {
  const existing = await shiftRepository.findByName(name);
  if (existing) {
    throw new ConflictError(Message.SHIFT.NAME_EXISTS, 'SHIFT_NAME_EXISTS');
  }

  return shiftRepository.create({ name, startTime, endTime });
}

export async function update(id: string, { name, startTime, endTime, isActive }: UpdateShiftInput) {
  const shift = await shiftRepository.findById(id);
  if (!shift) {
    throw new NotFoundError(Message.SHIFT.NOT_FOUND, 'SHIFT_NOT_FOUND');
  }

  if (name && name !== shift.name) {
    const existing = await shiftRepository.findByName(name);
    if (existing) {
      throw new ConflictError(Message.SHIFT.NAME_EXISTS, 'SHIFT_NAME_EXISTS');
    }
  }

  return shiftRepository.update(id, { name, startTime, endTime, isActive });
}

export async function remove(id: string): Promise<void> {
  const shift = await shiftRepository.findById(id);
  if (!shift) {
    throw new NotFoundError(Message.SHIFT.NOT_FOUND, 'SHIFT_NOT_FOUND');
  }

  const workScheduleCount = await shiftRepository.countWorkSchedule(id);
  if (workScheduleCount > 0) {
    throw new ConflictError(Message.SHIFT.HAS_WORK_SCHEDULE, 'SHIFT_HAS_WORK_SCHEDULE');
  }

  await shiftRepository.remove(id);
}
