// Thao tác DB cho module auth (dùng prisma để truy vấn bảng managerAccount)
import { prisma } from '../../config/prisma.js';

// Tìm tài khoản theo email
export function findByEmail(email: string) {
  return prisma.managerAccount.findUnique({ where: { email } });
}

// Tìm tài khoản theo id
export function findById(id: string) {
  return prisma.managerAccount.findUnique({ where: { id } });
}

// Lấy thông tin tối giản của tài khoản cho endpoint /me
export function findMeById(id: string) {
  return prisma.managerAccount.findUnique({
    where: { id },
    select: { id: true, email: true, role: true, employeeId: true },
  });
}

// Cập nhật password hash khi đổi mật khẩu
export function updatePasswordHash(id: string, passwordHash: string) {
  return prisma.managerAccount.update({ where: { id }, data: { passwordHash } });
}
