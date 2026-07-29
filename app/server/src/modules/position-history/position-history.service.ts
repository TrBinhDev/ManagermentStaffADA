import { Message } from "../../constants/message.js";
import { NotFoundError } from "../../errors/AppError.js";
import { daysBetween } from "../../utils/date.util.js";
import * as positionHistoryRepository from "./position-history.repository.js";

// Hàm lấy timeline (lịch sử) các vị trí công việc của nhân viên, kèm tính số ngày cho mỗi giai đoạn giữ vị trí
export async function getTimeline(employeeId: string) {
  const employee = await positionHistoryRepository.findEmployeeById(employeeId);
  if (!employee) {
    throw new NotFoundError(Message.EMPLOYEE.NOT_FOUND, "EMPLOYEE_NOT_FOUND");
  }

  const rows = await positionHistoryRepository.findByEmployeeId(employeeId);

  // Với mỗi vị trí đã giữ: tính số ngày = (ngày kết thúc, hoặc hiện tại nếu đang giữ) - ngày bắt đầu
  return rows.map((row) => ({
    id: row.id,
    position: row.position,
    startDate: row.startDate,
    endDate: row.endDate,
    days: daysBetween(row.startDate, row.endDate ?? new Date()), // Nếu endDate null (đang giữ vị trí) thì tính tới thời điểm hiện tại
  }));
}
