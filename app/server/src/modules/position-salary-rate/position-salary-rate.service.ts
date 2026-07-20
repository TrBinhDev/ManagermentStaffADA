import { Message } from '../../constants/message.js';
import { NotFoundError } from '../../errors/AppError.js';
import { startOfToday } from '../../utils/date.util.js';
import * as positionSalaryRateRepository from './position-salary-rate.repository.js';
import type { CreateSalaryRateInput } from './position-salary-rate.schema.js';

export async function list(positionId: string) {
  const position = await positionSalaryRateRepository.findPositionById(positionId);
  if (!position) {
    throw new NotFoundError(Message.POSITION_SALARY_RATE.POSITION_NOT_FOUND, 'POSITION_NOT_FOUND');
  }

  return positionSalaryRateRepository.findByPositionId(positionId);
}

export async function create(positionId: string, { hourlyRate }: CreateSalaryRateInput) {
  const position = await positionSalaryRateRepository.findPositionById(positionId);
  if (!position) {
    throw new NotFoundError(Message.POSITION_SALARY_RATE.POSITION_NOT_FOUND, 'POSITION_NOT_FOUND');
  }

  const openRate = await positionSalaryRateRepository.findOpenRate(positionId);
  const effectiveDate = startOfToday();

  return positionSalaryRateRepository.createRate(positionId, hourlyRate, openRate?.id, effectiveDate);
}
