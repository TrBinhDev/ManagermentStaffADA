import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";

// Cấu hình các trường liên quan cần lấy kèm (nhân viên, ca làm) khi query attendance
const summarySelect = {
  employee: { select: { id: true, code: true, fullName: true } },
  shift: { select: { id: true, name: true, startTime: true, endTime: true } },
} as const;

// Tìm kiếm nhân viên theo Id
export function findEmployeeById(employeeId: string) {
  return prisma.employee.findUnique({ where: { id: employeeId } });
}

// Tìm kiếm ca làm việc theo Id
export function findShiftById(shiftId: string) {
  return prisma.shift.findUnique({ where: { id: shiftId } });
}

// Tìm kiếm lịch làm việc (nhân viên có được xếp ca này vào ngày này không)
export function findWorkSchedule(
  employeeId: string,
  shiftId: string,
  workDate: Date,
) {
  return prisma.workSchedule.findUnique({
    where: { employeeId_shiftId_workDate: { employeeId, shiftId, workDate } },
  });
}

// Hàm kiểm tra xem nhân viên đã chấm công (check-in) ca này trong ngày này chưa
export function findExistingAttendance(
  employeeId: string,
  shiftId: string,
  workDate: Date,
) {
  return prisma.attendance.findUnique({
    where: { employeeId_workDate_shiftId: { employeeId, workDate, shiftId } },
  });
}

// Hàm tạo bản ghi check-in cho nhân viên
export function createCheckIn(
  employeeId: string,
  shiftId: string,
  workDate: Date,
  checkedInById: string,
) {
  return prisma.attendance.create({
    data: {
      employeeId,
      shiftId,
      workDate,
      checkedInAt: new Date(),
      checkedInById,
    },
    include: summarySelect, // Trả kèm thông tin nhân viên + ca làm
  });
}

// Tìm bản ghi chấm công theo Id
export function findById(id: string) {
  return prisma.attendance.findUnique({ where: { id } });
}

// Tìm vị trí/chức vụ của nhân viên tại một thời điểm cụ thể (dựa vào khoảng start-end của lịch sử vị trí)
export function findPositionHistoryAt(employeeId: string, at: Date) {
  return prisma.positionHistory.findFirst({
    where: {
      employeeId,
      startDate: { lte: at }, // Vị trí đã bắt đầu trước hoặc đúng thời điểm "at"
      OR: [{ endDate: null }, { endDate: { gt: at } }], // Và chưa kết thúc, hoặc kết thúc sau thời điểm "at"
    },
    orderBy: { startDate: "desc" }, // Lấy vị trí gần nhất (mới nhất) thỏa điều kiện
  });
}

// Tìm mức lương theo giờ đang áp dụng cho một vị trí tại ngày làm việc cụ thể
export function findSalaryRateAt(positionId: string, workDate: Date) {
  return prisma.positionSalaryRate.findFirst({
    where: {
      positionId,
      effectiveFrom: { lte: workDate }, // Mức lương đã có hiệu lực trước hoặc đúng ngày làm việc
      OR: [{ effectiveTo: null }, { effectiveTo: { gt: workDate } }], // Và chưa hết hiệu lực
    },
    orderBy: { effectiveFrom: "desc" }, // Lấy mức lương áp dụng gần nhất
  });
}

// Kiểu dữ liệu thông tin thanh toán lương dùng khi check-out
interface PaymentData {
  employeeId: string;
  positionId: string;
  workDate: Date;
  hoursWorked: Prisma.Decimal; // Số giờ đã làm
  hourlyRate: Prisma.Decimal; // Đơn giá lương theo giờ
  amount: Prisma.Decimal; // Tổng tiền lương
}

// Hàm xử lý check-out: cập nhật attendance + tạo bản ghi lương trong 1 transaction (đảm bảo toàn vẹn dữ liệu)
export function checkOutWithPayment(
  attendanceId: string,
  checkedOutById: string,
  checkedOutAt: Date,
  payment: PaymentData,
) {
  return prisma.$transaction(async (tx) => {
    // Cập nhật thời gian check-out và người thực hiện check-out
    const attendance = await tx.attendance.update({
      where: { id: attendanceId },
      data: { checkedOutAt, checkedOutById },
      include: summarySelect,
    });

    // Tạo bản ghi lương ngày (dailyPayment) gắn với bản ghi chấm công này
    const dailyPayment = await tx.dailyPayment.create({
      data: {
        attendanceId,
        employeeId: payment.employeeId,
        positionId: payment.positionId,
        workDate: payment.workDate,
        hoursWorked: payment.hoursWorked,
        hourlyRate: payment.hourlyRate,
        amount: payment.amount,
      },
    });

    return { attendance, dailyPayment }; // Trả về cả 2 bản ghi vừa cập nhật/tạo
  });
}

// Kiểu dữ liệu bộ lọc dùng để tìm kiếm/đếm danh sách chấm công
interface AttendanceFilters {
  employeeId?: string; // Lọc theo nhân viên (nếu có)
  from?: Date; // Lọc từ ngày (nếu có)
  to?: Date; // Lọc đến ngày (nếu có)
}

// Hàm dựng điều kiện where dùng chung cho findMany và count, tránh lặp code
function buildWhere({ employeeId, from, to }: AttendanceFilters) {
  return {
    ...(employeeId ? { employeeId } : {}), // Chỉ thêm điều kiện employeeId nếu có truyền vào
    ...(from || to
      ? {
          workDate: {
            ...(from ? { gte: from } : {}), // workDate >= from (nếu có)
            ...(to ? { lte: to } : {}), // workDate <= to (nếu có)
          },
        }
      : {}),
  };
}

// Hàm tìm danh sách chấm công theo bộ lọc, có phân trang (skip/take), sắp xếp mới nhất trước
export function findMany(
  filters: AttendanceFilters,
  skip: number,
  take: number,
) {
  return prisma.attendance.findMany({
    where: buildWhere(filters),
    skip, // Số bản ghi bỏ qua (phục vụ phân trang)
    take, // Số bản ghi lấy về (limit)
    orderBy: { workDate: "desc" },
    include: summarySelect,
  });
}

// Hàm đếm tổng số bản ghi chấm công thỏa bộ lọc (dùng để tính tổng số trang)
export function count(filters: AttendanceFilters) {
  return prisma.attendance.count({ where: buildWhere(filters) });
}
