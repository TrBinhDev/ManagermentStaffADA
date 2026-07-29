import { Message } from "../../constants/message.js";
import { NotFoundError } from "../../errors/AppError.js";
import { daysBetween } from "../../utils/date.util.js";
import * as employmentPeriodRepository from "./employment-period.repository.js";

// Hàm lấy timeline (lịch sử) các giai đoạn gắn bó của nhân viên, kèm tính số ngày cho mỗi giai đoạn
export async function getTimeline(employeeId: string) {
  const employee =
    await employmentPeriodRepository.findEmployeeById(employeeId);
  if (!employee) {
    throw new NotFoundError(Message.EMPLOYEE.NOT_FOUND, "EMPLOYEE_NOT_FOUND");
  }

  const rows = await employmentPeriodRepository.findByEmployeeId(employeeId);

  // Với mỗi giai đoạn: tính số ngày = (ngày kết thúc, hoặc hiện tại nếu đang gắn bó) - ngày bắt đầu
  return rows.map((row) => ({
    id: row.id,
    startDate: row.startDate,
    endDate: row.endDate,
    days: daysBetween(row.startDate, row.endDate ?? new Date()), // Nếu endDate null (đang làm việc) thì tính tới thời điểm hiện tại
  }));
}
