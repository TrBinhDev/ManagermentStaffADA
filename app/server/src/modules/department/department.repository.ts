import { prisma } from "../../config/prisma.js";

// Hàm dựng điều kiện where dùng chung, lọc theo tên phòng ban (không phân biệt hoa/thường) nếu có từ khóa tìm kiếm
function buildWhere(search?: string) {
  return search
    ? { name: { contains: search, mode: "insensitive" as const } }
    : {};
}

// Tìm danh sách phòng ban theo từ khóa tìm kiếm, có phân trang, sắp xếp theo tên tăng dần
export function findMany(
  search: string | undefined,
  skip: number,
  take: number,
) {
  return prisma.department.findMany({
    where: buildWhere(search),
    skip,
    take,
    orderBy: { name: "asc" },
  });
}

// Đếm tổng số phòng ban theo từ khóa tìm kiếm (phục vụ tính tổng số trang)
export function count(search: string | undefined) {
  return prisma.department.count({ where: buildWhere(search) });
}

// Tìm phòng ban theo Id
export function findById(id: string) {
  return prisma.department.findUnique({ where: { id } });
}

// Tìm phòng ban theo tên (dùng để kiểm tra trùng tên khi tạo/cập nhật)
export function findByName(name: string) {
  return prisma.department.findUnique({ where: { name } });
}

// Tạo mới phòng ban
export function create(name: string) {
  return prisma.department.create({ data: { name } });
}

// Cập nhật thông tin phòng ban (hiện chỉ hỗ trợ đổi tên)
export function update(id: string, data: { name?: string }) {
  return prisma.department.update({ where: { id }, data });
}

// Đếm số vị trí (position) đang thuộc về phòng ban này (dùng để kiểm tra trước khi xóa)
export function countPositions(departmentId: string) {
  return prisma.position.count({ where: { departmentId } });
}

// Xóa phòng ban theo Id
export function remove(id: string) {
  return prisma.department.delete({ where: { id } });
}
