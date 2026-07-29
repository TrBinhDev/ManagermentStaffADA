import { prisma } from "../../config/prisma.js";

// Tìm tài khoản quản lý theo email (dùng khi đăng nhập)
export function findByEmail(email: string) {
  return prisma.managerAccount.findUnique({ where: { email } });
}

// Tìm tài khoản quản lý theo Id (lấy đầy đủ thông tin, kể cả passwordHash)
export function findById(id: string) {
  return prisma.managerAccount.findUnique({ where: { id } });
}

// Tìm thông tin tài khoản đang đăng nhập (chỉ lấy các trường an toàn, không trả passwordHash)
export function findMeById(id: string) {
  return prisma.managerAccount.findUnique({
    where: { id },
    select: { id: true, email: true, role: true, employeeId: true },
  });
}

// Cập nhật mật khẩu mới (đã hash) cho tài khoản
export function updatePasswordHash(id: string, passwordHash: string) {
  return prisma.managerAccount.update({
    where: { id },
    data: { passwordHash },
  });
}
