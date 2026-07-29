import type { EmployeeStatus, Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";

// Cấu hình include chung: lấy kèm vị trí công việc + tên phòng ban
const positionSelect = {
  position: {
    select: { id: true, name: true, department: { select: { name: true } } },
  },
} as const;

// Hàm dựng điều kiện where dùng chung cho findMany và count
function buildWhere(params: {
  status?: EmployeeStatus;
  positionId?: string;
  departmentId?: string;
  search?: string;
}): Prisma.EmployeeWhereInput {
  const { status, positionId, departmentId, search } = params;

  return {
    ...(status ? { status } : {}), // Lọc theo trạng thái nếu có
    ...(positionId ? { positionId } : {}), // Lọc theo vị trí nếu có
    ...(departmentId ? { position: { departmentId } } : {}), // Lọc theo phòng ban (thông qua quan hệ position -> department)
    ...(search
      ? {
          // Tìm kiếm theo mã nhân viên HOẶC họ tên (không phân biệt hoa/thường)
          OR: [
            { code: { contains: search, mode: "insensitive" as const } },
            { fullName: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
}

// Tìm danh sách nhân viên theo bộ lọc, có phân trang, sắp xếp theo mã nhân viên tăng dần
export function findMany(
  filters: {
    status?: EmployeeStatus;
    positionId?: string;
    departmentId?: string;
    search?: string;
  },
  skip: number,
  take: number,
) {
  return prisma.employee.findMany({
    where: buildWhere(filters),
    skip,
    take,
    orderBy: { code: "asc" },
    select: {
      id: true,
      code: true,
      fullName: true,
      positionId: true,
      status: true,
    }, // Chỉ lấy trường cần thiết cho danh sách (nhẹ hơn include)
  });
}

// Đếm tổng số nhân viên theo bộ lọc (phục vụ tính tổng số trang)
export function count(filters: {
  status?: EmployeeStatus;
  positionId?: string;
  departmentId?: string;
  search?: string;
}) {
  return prisma.employee.count({ where: buildWhere(filters) });
}

// Tìm chi tiết nhân viên theo Id, kèm thông tin vị trí + phòng ban
export function findById(id: string) {
  return prisma.employee.findUnique({ where: { id }, include: positionSelect });
}

// Tìm nhân viên theo mã băm CCCD (dùng để kiểm tra trùng CCCD)
export function findByCccdHash(cccdHash: string) {
  return prisma.employee.findUnique({ where: { cccdHash } });
}

// Tìm vị trí công việc theo Id (dùng để validate positionId truyền vào)
export function findPositionById(positionId: string) {
  return prisma.position.findUnique({ where: { id: positionId } });
}

// Sinh mã nhân viên tự động theo dạng NVxxxx, dùng sequence của Postgres để đảm bảo tăng dần + không trùng khi chạy song song
export async function nextCode(): Promise<string> {
  const rows = await prisma.$queryRaw<{ nextval: bigint | number | string }[]>`
    SELECT nextval('employee_code_seq') as nextval
  `;
  const seq = Number(rows[0].nextval);
  return `NV${String(seq).padStart(4, "0")}`; // Ví dụ: NV0001, NV0002...
}

// Tạo mới bản ghi nhân viên
export function create(data: {
  code: string;
  cccdHash: string;
  fullName: string;
  dob?: Date;
  positionId: string;
}) {
  return prisma.employee.create({ data });
}

// Tạo mới hoặc cập nhật CCCD đã mã hóa trong hồ sơ nhân viên (upsert: có thì update, chưa có thì create)
export function upsertProfileCccd(employeeId: string, cccdEncrypted: string) {
  return prisma.employeeProfile.upsert({
    where: { employeeId },
    create: { employeeId, cccdEncrypted },
    update: { cccdEncrypted },
  });
}

// Cập nhật thông tin nhân viên (họ tên, ngày sinh, vị trí)
export function update(
  id: string,
  data: { fullName?: string; dob?: Date; positionId?: string },
) {
  return prisma.employee.update({
    where: { id },
    data,
    include: positionSelect,
  });
}

// Cập nhật trạng thái nhân viên (dùng chung cho resign/rehire), có thể kèm đổi vị trí nếu truyền positionId
export function updateStatus(
  id: string,
  status: EmployeeStatus,
  positionId?: string,
) {
  return prisma.employee.update({
    where: { id },
    data: { status, ...(positionId ? { positionId } : {}) },
    include: positionSelect,
  });
}

// Xóa cứng bản ghi nhân viên
export function remove(id: string) {
  return prisma.employee.delete({ where: { id } });
}

// Tạo bản ghi lịch sử vị trí mới (mặc định endDate = null, tức đang giữ vị trí này)
export function createPositionHistory(employeeId: string, positionId: string) {
  return prisma.positionHistory.create({ data: { employeeId, positionId } });
}

// Đóng (gắn ngày kết thúc) bản ghi lịch sử vị trí đang mở của nhân viên
export function closeOpenPositionHistory(employeeId: string) {
  return prisma.positionHistory.updateMany({
    where: { employeeId, endDate: null }, // Tìm bản ghi đang mở (chưa có ngày kết thúc)
    data: { endDate: new Date() },
  });
}

// Tạo bản ghi giai đoạn gắn bó mới (mặc định endDate = null, tức đang trong giai đoạn làm việc này)
export function createEmploymentPeriod(employeeId: string) {
  return prisma.employmentPeriod.create({ data: { employeeId } });
}

// Đóng (gắn ngày kết thúc) bản ghi giai đoạn gắn bó đang mở của nhân viên
export function closeOpenEmploymentPeriod(employeeId: string) {
  return prisma.employmentPeriod.updateMany({
    where: { employeeId, endDate: null },
    data: { endDate: new Date() },
  });
}
