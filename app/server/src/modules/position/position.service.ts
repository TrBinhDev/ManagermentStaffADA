import { Message } from "../../constants/message.js";
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
} from "../../errors/AppError.js";
import * as positionRepository from "./position.repository.js";
import type {
  ListPositionQuery,
  CreatePositionInput,
  UpdatePositionInput,
} from "./position.schema.js";

// Lấy danh sách vị trí có filter + phân trang
export async function list({
  departmentId,
  search,
  isActive,
  page,
  limit,
}: ListPositionQuery) {
  const skip = (page - 1) * limit; // Số bản ghi bỏ qua để phân trang
  const [data, total] = await Promise.all([
    positionRepository.findMany(departmentId, search, isActive, skip, limit), // Lấy dữ liệu trang hiện tại
    positionRepository.count(departmentId, search, isActive), // Đếm tổng số bản ghi (để tính tổng số trang)
  ]);

  return { data, total, page, limit };
}

// Lấy chi tiết 1 vị trí, không có thì báo lỗi 404
export async function getById(id: string) {
  const position = await positionRepository.findById(id);
  if (!position) {
    throw new NotFoundError(Message.POSITION.NOT_FOUND, "POSITION_NOT_FOUND");
  }
  return position;
}

// Tạo mới vị trí
export async function create({ name, departmentId }: CreatePositionInput) {
  // Kiểm tra phòng ban tồn tại
  const department = await positionRepository.findDepartmentById(departmentId);
  if (!department) {
    throw new BadRequestError(
      Message.POSITION.DEPARTMENT_NOT_FOUND,
      "DEPARTMENT_NOT_FOUND",
    );
  }

  // Kiểm tra trùng tên vị trí trong cùng phòng ban
  const existing = await positionRepository.findByNameAndDepartment(
    name,
    departmentId,
  );
  if (existing) {
    throw new ConflictError(
      Message.POSITION.NAME_EXISTS,
      "POSITION_NAME_EXISTS",
    );
  }

  return positionRepository.create(name, departmentId);
}

// Cập nhật vị trí
export async function update(
  id: string,
  { name, departmentId, isActive }: UpdatePositionInput,
) {
  const position = await positionRepository.findById(id);
  if (!position) {
    throw new NotFoundError(Message.POSITION.NOT_FOUND, "POSITION_NOT_FOUND");
  }

  // Nếu đổi phòng ban thì check phòng ban mới có tồn tại không
  if (departmentId) {
    const department =
      await positionRepository.findDepartmentById(departmentId);
    if (!department) {
      throw new BadRequestError(
        Message.POSITION.DEPARTMENT_NOT_FOUND,
        "DEPARTMENT_NOT_FOUND",
      );
    }
  }

  // Giá trị cuối cùng sau khi merge với dữ liệu cũ (nếu field không được gửi lên)
  const effectiveName = name ?? position.name;
  const effectiveDepartmentId = departmentId ?? position.departmentId;

  // Nếu tên hoặc phòng ban thay đổi thì check trùng lặp với vị trí khác
  if (
    effectiveName !== position.name ||
    effectiveDepartmentId !== position.departmentId
  ) {
    const existing = await positionRepository.findByNameAndDepartment(
      effectiveName,
      effectiveDepartmentId,
    );
    if (existing && existing.id !== id) {
      throw new ConflictError(
        Message.POSITION.NAME_EXISTS,
        "POSITION_NAME_EXISTS",
      );
    }
  }

  return positionRepository.update(id, { name, departmentId, isActive });
}

// Xóa vị trí - chỉ xóa được nếu chưa từng gắn với nhân viên (history) hoặc bảng lương (salary rate)
export async function remove(id: string): Promise<void> {
  const position = await positionRepository.findById(id);
  if (!position) {
    throw new NotFoundError(Message.POSITION.NOT_FOUND, "POSITION_NOT_FOUND");
  }

  // Đã có nhân viên từng giữ vị trí này -> không cho xóa
  const historyCount = await positionRepository.countPositionHistory(id);
  if (historyCount > 0) {
    throw new ConflictError(
      Message.POSITION.HAS_EMPLOYEES,
      "POSITION_HAS_EMPLOYEES",
    );
  }

  // Đã có mức lương gắn với vị trí này -> không cho xóa
  const salaryRateCount = await positionRepository.countSalaryRate(id);
  if (salaryRateCount > 0) {
    throw new ConflictError(
      Message.POSITION.HAS_SALARY_RATE,
      "POSITION_HAS_SALARY_RATE",
    );
  }

  await positionRepository.remove(id);
}
