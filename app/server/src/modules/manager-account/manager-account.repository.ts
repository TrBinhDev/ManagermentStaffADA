import type { ManagerRole } from "@prisma/client";
import { prisma } from "../../config/prisma.js";

// Cấu hình select chung: chỉ lấy các trường an toàn (không có passwordHash), kèm tên nhân viên liên kết
const accountSelect = {
  id: true,
  email: true,
  role: true,
  isActive: true,
  employeeId: true,
  createdAt: true,
  updatedAt: true,
  employee: { select: { fullName: true } },
} as const;

// Hàm dựng điều kiện where dùng chung cho findMany và count
function buildWhere(
  isActive: boolean | undefined,
  role: ManagerRole | undefined,
) {
  return {
    ...(isActive !== undefined ? { isActive } : {}), // Lọc theo trạng thái hoạt động nếu có
    ...(role ? { role } : {}), // Lọc theo vai trò nếu có
  };
}

// Tìm danh sách tài khoản theo bộ lọc, có phân trang, sắp xếp theo ngày tạo tăng dần (tài khoản cũ nhất trước)
export function findMany(
  isActive: boolean | undefined,
  role: ManagerRole | undefined,
  skip: number,
  take: number,
) {
  return prisma.managerAccount.findMany({
    where: buildWhere(isActive, role),
    skip,
    take,
    orderBy: { createdAt: "asc" },
    select: accountSelect,
  });
}

// Đếm tổng số tài khoản theo bộ lọc (phục vụ tính tổng số trang)
export function count(
  isActive: boolean | undefined,
  role: ManagerRole | undefined,
) {
  return prisma.managerAccount.count({ where: buildWhere(isActive, role) });
}

// Tìm chi tiết tài khoản theo Id (chỉ lấy trường an toàn, không có passwordHash)
export function findById(id: string) {
  return prisma.managerAccount.findUnique({
    where: { id },
    select: accountSelect,
  });
}

// Tìm tài khoản theo email (trả về đầy đủ trường, bao gồm passwordHash - dùng để kiểm tra trùng email)
export function findByEmail(email: string) {
  return prisma.managerAccount.findUnique({ where: { email } });
}

// Tìm tài khoản đang gắn với 1 nhân viên cụ thể (dùng kiểm tra ràng buộc 1 nhân viên - 1 tài khoản)
export function findByEmployeeId(employeeId: string) {
  return prisma.managerAccount.findUnique({ where: { employeeId } });
}

// Tìm nhân viên theo Id (dùng để validate employeeId truyền vào khi tạo/cập nhật tài khoản)
export function findEmployeeById(employeeId: string) {
  return prisma.employee.findUnique({ where: { id: employeeId } });
}

// Tạo mới tài khoản quản lý
export function create(data: {
  email: string;
  passwordHash: string;
  role: ManagerRole;
  employeeId?: string;
}) {
  return prisma.managerAccount.create({
    data: {
      email: data.email,
      passwordHash: data.passwordHash,
      role: data.role,
      employeeId: data.employeeId,
    },
    select: accountSelect,
  });
}

// Cập nhật thông tin tài khoản (trạng thái, email, vai trò, liên kết nhân viên)
export function update(
  id: string,
  data: {
    isActive?: boolean;
    email?: string;
    role?: ManagerRole;
    employeeId?: string | null;
  },
) {
  return prisma.managerAccount.update({
    where: { id },
    data,
    select: accountSelect,
  });
}

// Cập nhật riêng mật khẩu (đã hash) cho tài khoản, dùng cho chức năng đặt lại mật khẩu
export function updatePasswordHash(id: string, passwordHash: string) {
  return prisma.managerAccount.update({
    where: { id },
    data: { passwordHash },
  });
}

// Xóa tài khoản theo Id
export function remove(id: string) {
  return prisma.managerAccount.delete({ where: { id } });
}
