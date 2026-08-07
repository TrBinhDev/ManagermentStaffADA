import { Message } from "../../constants/message.js";
import { NotFoundError } from "../../errors/AppError.js";
import { monthRangeUTC } from "../../utils/date.util.js";
import * as dailyPaymentRepository from "./daily-payment.repository.js";
import type {
  ListEmployeePaymentsQuery,
  ListAllPaymentsQuery,
  SummaryQuery,
} from "./daily-payment.schema.js";

// Hàm lấy danh sách lương ngày của 1 nhân viên trong tháng, kèm tổng tiền và tổng giờ làm
export async function listByEmployee(
  employeeId: string,
  { month, year }: ListEmployeePaymentsQuery,
) {
  // Kiểm tra nhân viên có tồn tại không
  const employee = await dailyPaymentRepository.findEmployeeById(employeeId);
  if (!employee) {
    throw new NotFoundError(
      Message.DAILY_PAYMENT.EMPLOYEE_NOT_FOUND,
      "EMPLOYEE_NOT_FOUND",
    );
  }

  const { start, end } = monthRangeUTC(year, month); // Tính khoảng ngày đầu-cuối của tháng (theo UTC)
  const data = await dailyPaymentRepository.findByEmployeeAndRange(
    employeeId,
    start,
    end,
  );

  // Cộng dồn tổng tiền lương và tổng số giờ làm trong tháng từ danh sách bản ghi
  const totalAmount = data.reduce((sum, row) => sum + Number(row.amount), 0);
  const totalHours = data.reduce(
    (sum, row) => sum + Number(row.hoursWorked),
    0,
  );

  return { data, totalAmount, totalHours };
}

// Hàm lấy tổng lương toàn nhà hàng trong tháng - 1 con số duy nhất, KHÔNG phân trang, KHÔNG đổi theo
// search/sort của listAll. Tách riêng để FE chỉ cần gọi lại khi đổi month/year.
export async function getSummary({ month, year }: SummaryQuery) {
  const { start, end } = monthRangeUTC(year, month);
  const result = await dailyPaymentRepository.aggregateGrandTotal(
    start,
    end,
    undefined,
  );
  return { grandTotal: Number(result._sum.amount ?? 0) };
}

// Ghép danh sách nhân viên với tổng lương/giờ tương ứng (dùng chung cho cả 2 nhánh sortBy bên dưới)
async function attachPayments(
  employees: { id: string; fullName: string }[],
  start: Date,
  end: Date,
) {
  const employeeIds = employees.map((e) => e.id);
  const sums =
    employeeIds.length > 0
      ? await dailyPaymentRepository.sumByEmployeeIds(employeeIds, start, end)
      : [];
  const sumByEmployeeId = new Map(sums.map((s) => [s.employeeId, s]));

  return employees.map((emp) => ({
    employeeId: emp.id,
    fullName: emp.fullName,
    totalAmount: Number(sumByEmployeeId.get(emp.id)?._sum.amount ?? 0), // Chưa có lương tháng này -> mặc định 0
    totalHours: Number(sumByEmployeeId.get(emp.id)?._sum.hoursWorked ?? 0),
  }));
}

// Hàm lấy danh sách lương theo từng nhân viên trong tháng, có phân trang + tìm theo tên + sort theo tên/lương.
export async function listAll({
  month,
  year,
  employeeId,
  search,
  sortBy,
  sortOrder,
  page,
  limit,
}: ListAllPaymentsQuery) {
  const { start, end } = monthRangeUTC(year, month);

  if (sortBy === "name") {
    // Phân trang NGAY ở tầng Employee -> groupBy chỉ cần tính cho đúng 1 trang (vd 9 người), nhẹ.
    const skip = (page - 1) * limit;
    const [employees, total] = await Promise.all([
      dailyPaymentRepository.findEmployeesForPayments(
        search,
        employeeId,
        sortOrder,
        skip,
        limit,
      ),
      dailyPaymentRepository.countEmployeesForPayments(search, employeeId),
    ]);
    const data = await attachPayments(employees, start, end);
    return { data, total, page, limit };
  }

  // sortBy === "amount": phải biết tổng lương của TẤT CẢ nhân viên khớp filter trước mới sort đúng được,
  // nên lấy hết (không skip/take ở Employee), groupBy hết, sort theo totalAmount, rồi mới cắt trang trong JS.
  const employees = await dailyPaymentRepository.findEmployeesForPayments(
    search,
    employeeId,
  );
  const all = await attachPayments(employees, start, end);

  all.sort((a, b) =>
    sortOrder === "asc"
      ? a.totalAmount - b.totalAmount
      : b.totalAmount - a.totalAmount,
  );

  const total = all.length;
  const skip = (page - 1) * limit;
  const data = all.slice(skip, skip + limit);

  return { data, total, page, limit };
}
