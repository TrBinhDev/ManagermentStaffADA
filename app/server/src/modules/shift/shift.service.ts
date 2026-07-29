import { Message } from "../../constants/message.js";
import { NotFoundError, ConflictError } from "../../errors/AppError.js";
import * as shiftRepository from "./shift.repository.js";
import type {
  ListShiftQuery,
  CreateShiftInput,
  UpdateShiftInput,
} from "./shift.schema.js";

// Hàm lấy danh sách ca làm việc có lọc + phân trang
export async function list({ isActive, page, limit }: ListShiftQuery) {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    shiftRepository.findMany(isActive, skip, limit),
    shiftRepository.count(isActive),
  ]);

  return { data, total, page, limit };
}

// Hàm lấy chi tiết 1 ca làm việc theo Id
export async function getById(id: string) {
  const shift = await shiftRepository.findById(id);
  if (!shift) {
    throw new NotFoundError(Message.SHIFT.NOT_FOUND, "SHIFT_NOT_FOUND");
  }
  return shift;
}

// Hàm tạo mới ca làm việc
export async function create({ name, startTime, endTime }: CreateShiftInput) {
  // Kiểm tra tên ca đã tồn tại chưa (tránh trùng tên)
  const existing = await shiftRepository.findByName(name);
  if (existing) {
    throw new ConflictError(Message.SHIFT.NAME_EXISTS, "SHIFT_NAME_EXISTS");
  }

  return shiftRepository.create({ name, startTime, endTime });
}

// Hàm cập nhật thông tin ca làm việc
export async function update(
  id: string,
  { name, startTime, endTime, isActive }: UpdateShiftInput,
) {
  const shift = await shiftRepository.findById(id);
  if (!shift) {
    throw new NotFoundError(Message.SHIFT.NOT_FOUND, "SHIFT_NOT_FOUND");
  }

  // Nếu có đổi tên (khác tên hiện tại) thì kiểm tra tên mới có bị trùng với ca khác không
  if (name && name !== shift.name) {
    const existing = await shiftRepository.findByName(name);
    if (existing) {
      throw new ConflictError(Message.SHIFT.NAME_EXISTS, "SHIFT_NAME_EXISTS");
    }
  }

  return shiftRepository.update(id, { name, startTime, endTime, isActive });
}

// Hàm xóa ca làm việc
export async function remove(id: string): Promise<void> {
  const shift = await shiftRepository.findById(id);
  if (!shift) {
    throw new NotFoundError(Message.SHIFT.NOT_FOUND, "SHIFT_NOT_FOUND");
  }

  // Kiểm tra ca này còn được xếp lịch làm việc (WorkSchedule) nào không
  const workScheduleCount = await shiftRepository.countWorkSchedule(id);
  if (workScheduleCount > 0) {
    // Không cho xóa nếu vẫn còn lịch làm việc liên kết (tránh dữ liệu mồ côi/mất tham chiếu)
    throw new ConflictError(
      Message.SHIFT.HAS_WORK_SCHEDULE,
      "SHIFT_HAS_WORK_SCHEDULE",
    );
  }

  await shiftRepository.remove(id);
}
