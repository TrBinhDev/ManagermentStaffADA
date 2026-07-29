import { Message } from "../../constants/message.js";
import { NotFoundError, ConflictError } from "../../errors/AppError.js";
import * as capacityRepository from "./shift-position-capacity.repository.js";
import type {
  CreateCapacityInput,
  UpdateCapacityInput,
} from "./shift-position-capacity.schema.js";

// Hàm phụ trợ: kiểm tra ca làm việc có tồn tại không
async function ensureShiftExists(shiftId: string) {
  const shift = await capacityRepository.findShiftById(shiftId);
  if (!shift) {
    throw new NotFoundError(
      Message.SHIFT_POSITION_CAPACITY.SHIFT_NOT_FOUND,
      "SHIFT_NOT_FOUND",
    );
  }
}

// Hàm phụ trợ: kiểm tra bản ghi giới hạn có tồn tại VÀ thực sự thuộc về ca đang thao tác không
// (chặn trường hợp truyền capacityId của ca A nhưng URL lại đang thao tác trên ca B)
async function ensureCapacityBelongsToShift(
  shiftId: string,
  capacityId: string,
) {
  const capacity = await capacityRepository.findById(capacityId);
  if (!capacity || capacity.shiftId !== shiftId) {
    throw new NotFoundError(
      Message.SHIFT_POSITION_CAPACITY.NOT_FOUND,
      "CAPACITY_NOT_FOUND",
    );
  }
  return capacity;
}

// Hàm lấy danh sách giới hạn nhân sự của 1 ca làm việc
export async function list(shiftId: string) {
  await ensureShiftExists(shiftId);
  return capacityRepository.findByShiftId(shiftId);
}

// Hàm tạo mới giới hạn nhân sự cho 1 vị trí trong ca làm việc
export async function create(
  shiftId: string,
  { positionId, maxStaff }: CreateCapacityInput,
) {
  await ensureShiftExists(shiftId);

  // Kiểm tra vị trí có tồn tại không
  const position = await capacityRepository.findPositionById(positionId);
  if (!position) {
    throw new NotFoundError(
      Message.SHIFT_POSITION_CAPACITY.POSITION_NOT_FOUND,
      "POSITION_NOT_FOUND",
    );
  }

  // Kiểm tra cặp (ca, vị trí) này đã có giới hạn chưa (tránh trùng, khớp @@unique([shiftId, positionId]) ở Prisma schema)
  const existing = await capacityRepository.findByShiftAndPosition(
    shiftId,
    positionId,
  );
  if (existing) {
    throw new ConflictError(
      Message.SHIFT_POSITION_CAPACITY.PAIR_EXISTS,
      "CAPACITY_PAIR_EXISTS",
    );
  }

  return capacityRepository.create(shiftId, positionId, maxStaff);
}

// Hàm cập nhật giới hạn nhân sự (chỉ sửa maxStaff)
export async function update(
  shiftId: string,
  capacityId: string,
  { maxStaff }: UpdateCapacityInput,
) {
  await ensureShiftExists(shiftId);
  await ensureCapacityBelongsToShift(shiftId, capacityId); // Chặn sửa nhầm/sửa chéo bản ghi của ca khác

  return capacityRepository.update(capacityId, maxStaff);
}

// Hàm xóa giới hạn nhân sự
export async function remove(
  shiftId: string,
  capacityId: string,
): Promise<void> {
  await ensureShiftExists(shiftId);
  await ensureCapacityBelongsToShift(shiftId, capacityId); // Chặn xóa nhầm/xóa chéo bản ghi của ca khác

  await capacityRepository.remove(capacityId);
}
