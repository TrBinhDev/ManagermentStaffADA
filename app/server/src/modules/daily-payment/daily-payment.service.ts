import { Message } from '../../constants/message.js';
import { NotFoundError } from '../../errors/AppError.js';
import { monthRangeUTC } from '../../utils/date.util.js';
import * as dailyPaymentRepository from './daily-payment.repository.js';
import type { ListEmployeePaymentsQuery, ListAllPaymentsQuery } from './daily-payment.schema.js';

// Hàm lấy danh sách lương ngày của 1 nhân viên trong tháng, kèm tổng tiền và tổng giờ làm
export async function listByEmployee(employeeId: string, { month, year }: ListEmployeePaymentsQuery) {
  // Kiểm tra nhân viên có tồn tại không
  const employee = await dailyPaymentRepository.findEmployeeById(employeeId);
  if (!employee) {
    throw new NotFoundError(Message.DAILY_PAYMENT.EMPLOYEE_NOT_FOUND, 'EMPLOYEE_NOT_FOUND');
  }

  const { start, end } = monthRangeUTC(year, month); // Tính khoảng ngày đầu-cuối của tháng (theo UTC)
  const data = await dailyPaymentRepository.findByEmployeeAndRange(employeeId, start, end);

  // Cộng dồn tổng tiền lương và tổng số giờ làm trong tháng từ danh sách bản ghi
  const totalAmount = data.reduce((sum, row) => sum + Number(row.amount), 0);
  const totalHours = data.reduce((sum, row) => sum + Number(row.hoursWorked), 0);

  return { data, totalAmount, totalHours };
}

// Hàm lấy danh sách lương ngày của tất cả nhân viên trong tháng, gộp nhóm và tính tổng theo từng nhân viên
export async function listAll({ month, year, employeeId }: ListAllPaymentsQuery) {
  const { start, end } = monthRangeUTC(year, month); // Tính khoảng ngày đầu-cuối của tháng
  const rows = await dailyPaymentRepository.findAllByRange(start, end, employeeId); // Lấy toàn bộ bản ghi lương trong tháng (có thể lọc theo employeeId)

  // Map dùng để gộp nhóm dữ liệu theo từng nhân viên (key = employeeId)
  const byEmployee = new Map<
    string,
    { employeeId: string; fullName: string; totalAmount: number; totalHours: number }
  >();

  // Duyệt từng bản ghi lương, cộng dồn tổng tiền + tổng giờ vào đúng nhân viên tương ứng
  for (const row of rows) {
    if (!byEmployee.has(row.employeeId)) {
      // Nếu nhân viên chưa có trong map thì khởi tạo entry mới
      byEmployee.set(row.employeeId, {
        employeeId: row.employeeId,
        fullName: row.employee.fullName,
        totalAmount: 0,
        totalHours: 0,
      });
    }
    const entry = byEmployee.get(row.employeeId)!;
    entry.totalAmount += Number(row.amount);
    entry.totalHours += Number(row.hoursWorked);
  }

  const data = Array.from(byEmployee.values()); // Chuyển Map thành mảng để trả về
  const grandTotal = data.reduce((sum, entry) => sum + entry.totalAmount, 0); // Tổng tiền lương của tất cả nhân viên

  return { data, grandTotal };
}