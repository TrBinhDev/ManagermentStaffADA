import { Message } from '../../constants/message.js';
import { NotFoundError, ConflictError } from '../../errors/AppError.js';
import * as capacityRepository from './shift-position-capacity.repository.js';
import type { CreateCapacityInput, UpdateCapacityInput } from './shift-position-capacity.schema.js';

async function ensureShiftExists(shiftId: string) {
  const shift = await capacityRepository.findShiftById(shiftId);
  if (!shift) {
    throw new NotFoundError(Message.SHIFT_POSITION_CAPACITY.SHIFT_NOT_FOUND, 'SHIFT_NOT_FOUND');
  }
}

// Capacity duoc truy cap qua URL long /shifts/:id/capacities/:capacityId - phai kiem tra
// capacityId do thuc su thuoc ve shiftId trong URL, tranh 1 shift sua/xoa nham capacity cua shift khac.
async function ensureCapacityBelongsToShift(shiftId: string, capacityId: string) {
  const capacity = await capacityRepository.findById(capacityId);
  if (!capacity || capacity.shiftId !== shiftId) {
    throw new NotFoundError(Message.SHIFT_POSITION_CAPACITY.NOT_FOUND, 'CAPACITY_NOT_FOUND');
  }
  return capacity;
}

export async function list(shiftId: string) {
  await ensureShiftExists(shiftId);
  return capacityRepository.findByShiftId(shiftId);
}

export async function create(shiftId: string, { positionId, maxStaff }: CreateCapacityInput) {
  await ensureShiftExists(shiftId);

  const position = await capacityRepository.findPositionById(positionId);
  if (!position) {
    throw new NotFoundError(Message.SHIFT_POSITION_CAPACITY.POSITION_NOT_FOUND, 'POSITION_NOT_FOUND');
  }

  const existing = await capacityRepository.findByShiftAndPosition(shiftId, positionId);
  if (existing) {
    throw new ConflictError(Message.SHIFT_POSITION_CAPACITY.PAIR_EXISTS, 'CAPACITY_PAIR_EXISTS');
  }

  return capacityRepository.create(shiftId, positionId, maxStaff);
}

export async function update(shiftId: string, capacityId: string, { maxStaff }: UpdateCapacityInput) {
  await ensureShiftExists(shiftId);
  await ensureCapacityBelongsToShift(shiftId, capacityId);

  return capacityRepository.update(capacityId, maxStaff);
}

export async function remove(shiftId: string, capacityId: string): Promise<void> {
  await ensureShiftExists(shiftId);
  await ensureCapacityBelongsToShift(shiftId, capacityId);

  await capacityRepository.remove(capacityId);
}
