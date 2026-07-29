import { Message } from "../../constants/message.js";
import { NotFoundError } from "../../errors/AppError.js";
import { startOfToday } from "../../utils/date.util.js";
import * as positionSalaryRateRepository from "./position-salary-rate.repository.js";
import type { CreateSalaryRateInput } from "./position-salary-rate.schema.js";

// Hàm lấy danh sách lịch sử mức lương của 1 vị trí
export async function list(positionId: string) {
  const position =
    await positionSalaryRateRepository.findPositionById(positionId);
  if (!position) {
    throw new NotFoundError(
      Message.POSITION_SALARY_RATE.POSITION_NOT_FOUND,
      "POSITION_NOT_FOUND",
    );
  }

  return positionSalaryRateRepository.findByPositionId(positionId);
}

// Hàm tạo mức lương mới cho 1 vị trí — tự động đóng mức lương cũ đang mở (nếu có) và mở mức mới từ hôm nay
export async function create(
  positionId: string,
  { hourlyRate }: CreateSalaryRateInput,
) {
  const position =
    await positionSalaryRateRepository.findPositionById(positionId);
  if (!position) {
    throw new NotFoundError(
      Message.POSITION_SALARY_RATE.POSITION_NOT_FOUND,
      "POSITION_NOT_FOUND",
    );
  }

  const openRate = await positionSalaryRateRepository.findOpenRate(positionId); // Tìm mức lương đang áp dụng (effectiveTo = null)
  const effectiveDate = startOfToday(); // Ngày hiệu lực của mức lương mới = đầu ngày hôm nay (không cho chọn tùy ý)

  // Đóng mức lương cũ (nếu có, truyền openRate?.id) + tạo mức lương mới, đúng như dự đoán ở các câu trước
  return positionSalaryRateRepository.createRate(
    positionId,
    hourlyRate,
    openRate?.id,
    effectiveDate,
  );
}
