import { prisma } from "../../config/prisma.js";

const departmentSelect = {
  department: { select: { id: true, name: true } },
} as const; // Include kèm id + name của phòng ban
const departmentNameSelect = {
  department: { select: { name: true } },
} as const; // Include chỉ name của phòng ban (dùng cho list, đỡ nặng)

// Build điều kiện where dùng chung cho findMany và count, tránh lặp code
function buildWhere(
  departmentId: string | undefined,
  search: string | undefined,
  isActive: boolean | undefined,
) {
  return {
    ...(departmentId ? { departmentId } : {}), // Lọc theo phòng ban nếu có
    ...(search
      ? { name: { contains: search, mode: "insensitive" as const } }
      : {}), // Tìm theo tên, không phân biệt hoa thường
    ...(isActive !== undefined ? { isActive } : {}), // Lọc theo trạng thái hoạt động nếu có
  };
}

// Lấy danh sách vị trí có phân trang, kèm tên phòng ban
export function findMany(
  departmentId: string | undefined,
  search: string | undefined,
  isActive: boolean | undefined,
  skip: number,
  take: number,
) {
  return prisma.position.findMany({
    where: buildWhere(departmentId, search, isActive),
    skip,
    take,
    orderBy: { name: "asc" },
    include: departmentNameSelect,
  });
}

// Đếm tổng số vị trí thỏa điều kiện (phục vụ tính tổng số trang)
export function count(
  departmentId: string | undefined,
  search: string | undefined,
  isActive: boolean | undefined,
) {
  return prisma.position.count({
    where: buildWhere(departmentId, search, isActive),
  });
}

// Lấy 1 vị trí theo id, kèm thông tin phòng ban
export function findById(id: string) {
  return prisma.position.findUnique({
    where: { id },
    include: departmentSelect,
  });
}

// Tìm vị trí theo tên trong 1 phòng ban cụ thể (check trùng, dựa vào unique compound key name_departmentId)
export function findByNameAndDepartment(name: string, departmentId: string) {
  return prisma.position.findUnique({
    where: { name_departmentId: { name, departmentId } },
  });
}

// Tìm phòng ban theo id (check tồn tại)
export function findDepartmentById(departmentId: string) {
  return prisma.department.findUnique({ where: { id: departmentId } });
}

// Tạo mới vị trí, trả về kèm thông tin phòng ban
export function create(name: string, departmentId: string) {
  return prisma.position.create({
    data: { name, departmentId },
    include: departmentSelect,
  });
}

// Cập nhật vị trí theo id
export function update(
  id: string,
  data: { name?: string; departmentId?: string; isActive?: boolean },
) {
  return prisma.position.update({
    where: { id },
    data,
    include: departmentSelect,
  });
}

// Đếm số lần vị trí này từng xuất hiện trong lịch sử nhân viên (dùng để chặn xóa nếu > 0)
export function countPositionHistory(positionId: string) {
  return prisma.positionHistory.count({ where: { positionId } });
}

// Đếm số mức lương đang gắn với vị trí này (dùng để chặn xóa nếu > 0)
export function countSalaryRate(positionId: string) {
  return prisma.positionSalaryRate.count({ where: { positionId } });
}

// Xóa vị trí theo id
export function remove(id: string) {
  return prisma.position.delete({ where: { id } });
}
