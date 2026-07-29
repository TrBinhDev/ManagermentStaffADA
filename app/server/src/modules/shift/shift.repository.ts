import { prisma } from "../../config/prisma.js";

// Hàm dựng điều kiện where dùng chung cho findMany và count
function buildWhere(isActive: boolean | undefined) {
  return isActive !== undefined ? { isActive } : {};
}

// Tìm danh sách ca làm việc theo bộ lọc, có phân trang, sắp xếp theo tên tăng dần
export function findMany(
  isActive: boolean | undefined,
  skip: number,
  take: number,
) {
  return prisma.shift.findMany({
    where: buildWhere(isActive),
    skip,
    take,
    orderBy: { name: "asc" },
  });
}

// Đếm tổng số ca làm việc theo bộ lọc (phục vụ tính tổng số trang)
export function count(isActive: boolean | undefined) {
  return prisma.shift.count({ where: buildWhere(isActive) });
}

// Tìm chi tiết ca làm việc theo Id
export function findById(id: string) {
  return prisma.shift.findUnique({ where: { id } });
}

// Tìm ca làm việc theo tên (dùng để kiểm tra trùng tên khi tạo/cập nhật)
export function findByName(name: string) {
  return prisma.shift.findUnique({ where: { name } });
}

// Tạo mới ca làm việc
export function create(data: {
  name: string;
  startTime: string;
  endTime: string;
}) {
  return prisma.shift.create({ data });
}

// Cập nhật ca làm việc (tên, giờ, trạng thái hoạt động)
export function update(
  id: string,
  data: {
    name?: string;
    startTime?: string;
    endTime?: string;
    isActive?: boolean;
  },
) {
  return prisma.shift.update({ where: { id }, data });
}

// Đếm số bản ghi WorkSchedule đang tham chiếu tới ca này, dùng để chặn xóa cứng ở service.
// LƯU Ý: đếm TOÀN BỘ lịch sử, không lọc theo ngày (kể cả WorkSchedule của những ngày đã qua từ lâu,
// dù ngày đó nhân viên có chấm công hay không). Đây là chủ đích: WorkSchedule.shift đang khai báo
// onDelete: Restrict trong Prisma schema, nên dù có lọc chỉ đếm lịch tương lai ở đây thì khi gọi
// shiftRepository.remove(id), Postgres vẫn sẽ chặn ở tầng DB nếu còn BẤT KỲ WorkSchedule nào (kể cả
// quá khứ) trỏ tới ca này -> không thể xóa cứng 1 ca đã từng được xếp lịch, dù chỉ 1 lần trong quá khứ.
// Muốn ngừng sử dụng 1 ca đã có lịch sử, dùng update({ isActive: false }) (nút "Ẩn" ở FE) thay vì remove().
export function countWorkSchedule(shiftId: string) {
  return prisma.workSchedule.count({ where: { shiftId } });
}

// Xóa cứng ca làm việc. Chỉ thành công khi ca CHƯA TỪNG được xếp lịch (WorkSchedule) lần nào,
// nhờ có bước check countWorkSchedule ở service trước khi gọi hàm này.
export function remove(id: string) {
  return prisma.shift.delete({ where: { id } });
}
