import { Message } from "../../constants/message.js";
import { NotFoundError, ConflictError } from "../../errors/AppError.js";
import * as departmentRepository from "./department.repository.js";
import type {
  ListDepartmentQuery,
  CreateDepartmentInput,
  UpdateDepartmentInput,
} from "./department.schema.js";

// Hàm lấy danh sách phòng ban có tìm kiếm + phân trang
export async function list({ search, page, limit }: ListDepartmentQuery) {
  const skip = (page - 1) * limit; // Số bản ghi cần bỏ qua để phân trang
  // Lấy dữ liệu và đếm tổng số bản ghi song song để tối ưu tốc độ
  const [data, total] = await Promise.all([
    departmentRepository.findMany(search, skip, limit),
    departmentRepository.count(search),
  ]);

  return { data, total, page, limit };
}

// Hàm lấy chi tiết 1 phòng ban theo Id
export async function getById(id: string) {
  const department = await departmentRepository.findById(id);
  if (!department) {
    throw new NotFoundError(
      Message.DEPARTMENT.NOT_FOUND,
      "DEPARTMENT_NOT_FOUND",
    );
  }
  return department;
}

// Hàm tạo mới phòng ban
export async function create({ name }: CreateDepartmentInput) {
  // Kiểm tra tên phòng ban đã tồn tại chưa (tránh trùng tên)
  const existing = await departmentRepository.findByName(name);
  if (existing) {
    throw new ConflictError(
      Message.DEPARTMENT.NAME_EXISTS,
      "DEPARTMENT_NAME_EXISTS",
    );
  }

  return departmentRepository.create(name);
}

// Hàm cập nhật thông tin phòng ban
export async function update(id: string, { name }: UpdateDepartmentInput) {
  // Kiểm tra phòng ban có tồn tại không
  const department = await departmentRepository.findById(id);
  if (!department) {
    throw new NotFoundError(
      Message.DEPARTMENT.NOT_FOUND,
      "DEPARTMENT_NOT_FOUND",
    );
  }

  // Nếu có đổi tên (name khác tên hiện tại) thì kiểm tra tên mới có bị trùng với phòng ban khác không
  if (name && name !== department.name) {
    const existing = await departmentRepository.findByName(name);
    if (existing) {
      throw new ConflictError(
        Message.DEPARTMENT.NAME_EXISTS,
        "DEPARTMENT_NAME_EXISTS",
      );
    }
  }

  return departmentRepository.update(id, { name });
}

// Hàm xóa phòng ban
export async function remove(id: string): Promise<void> {
  // Kiểm tra phòng ban có tồn tại không
  const department = await departmentRepository.findById(id);
  if (!department) {
    throw new NotFoundError(
      Message.DEPARTMENT.NOT_FOUND,
      "DEPARTMENT_NOT_FOUND",
    );
  }

  // Kiểm tra phòng ban còn vị trí công việc (position) nào đang thuộc về nó không
  const positionsCount = await departmentRepository.countPositions(id);
  if (positionsCount > 0) {
    // Không cho xóa nếu vẫn còn position liên kết (tránh dữ liệu mồ côi/mất tham chiếu)
    throw new ConflictError(
      Message.DEPARTMENT.HAS_POSITIONS,
      "DEPARTMENT_HAS_POSITIONS",
    );
  }

  await departmentRepository.remove(id);
}
