import { prisma } from "../../config/prisma.js";

// Tìm nhân viên theo Id
export function findEmployeeById(employeeId: string) {
  return prisma.employee.findUnique({ where: { id: employeeId } });
}

// Tìm danh sách lương ngày của 1 nhân viên trong khoảng thời gian [start, end)
export function findByEmployeeAndRange(
  employeeId: string,
  start: Date,
  end: Date,
) {
  return prisma.dailyPayment.findMany({
    where: { employeeId, workDate: { gte: start, lt: end } }, // Từ start (bao gồm) đến end (không bao gồm)
    orderBy: { workDate: "asc" }, // Sắp xếp theo ngày làm việc tăng dần
    include: { position: { select: { id: true, name: true } } }, // Kèm thông tin vị trí công việc
  });
}

// Tổng lương toàn nhà hàng (hoặc của 1 nhân viên nếu có employeeId) trong khoảng thời gian - 1 con số duy nhất,
// dùng aggregate ở DB thay vì kéo hết record về cộng tay, không phụ thuộc phân trang/sort
export function aggregateGrandTotal(
  start: Date,
  end: Date,
  employeeId: string | undefined,
) {
  return prisma.dailyPayment.aggregate({
    where: {
      workDate: { gte: start, lt: end },
      ...(employeeId ? { employeeId } : {}),
    },
    _sum: { amount: true },
  });
}

function buildEmployeeWhere(
  search: string | undefined,
  employeeId: string | undefined,
) {
  return {
    ...(employeeId ? { id: employeeId } : {}),
    ...(search
      ? { fullName: { contains: search, mode: "insensitive" as const } }
      : {}),
  };
}

// Danh sách nhân viên khớp filter (search/employeeId).
// - sortBy=name: truyền orderBy + skip/take -> phân trang ngay ở đây (nhẹ, chỉ query đúng 1 trang).
// - sortBy=amount: gọi KHÔNG truyền orderBy/skip/take -> lấy hết, để service tự sort theo lương rồi cắt trang sau.
export function findEmployeesForPayments(
  search: string | undefined,
  employeeId: string | undefined,
  orderBy?: "asc" | "desc",
  skip?: number,
  take?: number,
) {
  return prisma.employee.findMany({
    where: buildEmployeeWhere(search, employeeId),
    ...(orderBy ? { orderBy: { fullName: orderBy } } : {}),
    ...(skip !== undefined ? { skip } : {}),
    ...(take !== undefined ? { take } : {}),
    select: { id: true, fullName: true },
  });
}

// Đếm tổng số nhân viên khớp filter - chỉ cần khi sortBy=name (phân trang ngay ở Employee),
// vì sortBy=amount đã lấy hết nên total = length của mảng, không cần đếm riêng.
export function countEmployeesForPayments(
  search: string | undefined,
  employeeId: string | undefined,
) {
  return prisma.employee.count({
    where: buildEmployeeWhere(search, employeeId),
  });
}

// Tính tổng lương + tổng giờ theo từng nhân viên, CHỈ trong danh sách employeeIds truyền vào
// - dùng groupBy để DB tự cộng dồn, mỗi nhân viên chỉ trả về 1 dòng tổng (không phải N dòng theo từng ngày)
export function sumByEmployeeIds(
  employeeIds: string[],
  start: Date,
  end: Date,
) {
  return prisma.dailyPayment.groupBy({
    by: ["employeeId"],
    where: {
      employeeId: { in: employeeIds },
      workDate: { gte: start, lt: end },
    },
    _sum: { amount: true, hoursWorked: true },
  });
}
