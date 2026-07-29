import { Prisma } from '@prisma/client';
import { Message } from "../../constants/message.js";
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
} from "../../errors/AppError.js";
import { hashCccd } from "../../utils/hash.util.js";
import { encrypt } from "../../utils/crypto.util.js";
import * as employeeRepository from "./employee.repository.js";
import type {
  ListEmployeeQuery,
  CreateEmployeeInput,
  UpdateEmployeeInput,
  RehireEmployeeInput,
} from "./employee.schema.js";

// Hàm lấy danh sách nhân viên có lọc + phân trang
export async function list({
  status,
  positionId,
  departmentId,
  search,
  page,
  limit,
}: ListEmployeeQuery) {
  const filters = { status, positionId, departmentId, search };
  const skip = (page - 1) * limit; // Số bản ghi bỏ qua để phân trang

  // Lấy dữ liệu và đếm tổng số bản ghi song song để tối ưu tốc độ
  const [data, total] = await Promise.all([
    employeeRepository.findMany(filters, skip, limit),
    employeeRepository.count(filters),
  ]);

  return { data, total, page, limit };
}

// Hàm lấy chi tiết 1 nhân viên theo Id
export async function getById(id: string) {
  const employee = await employeeRepository.findById(id);
  if (!employee) {
    throw new NotFoundError(Message.EMPLOYEE.NOT_FOUND, "EMPLOYEE_NOT_FOUND");
  }
  return employee;
}

// Hàm tạo mới nhân viên
export async function create({
  cccd,
  fullName,
  dob,
  positionId,
}: CreateEmployeeInput) {
  const cccdHash = hashCccd(cccd); // Băm CCCD để tìm kiếm/kiểm tra trùng (không thể đảo ngược)
  const existing = await employeeRepository.findByCccdHash(cccdHash);

  if (existing) {
    // CCCD đã tồn tại và nhân viên đó vẫn đang làm việc -> không cho tạo trùng
    if (existing.status === "ACTIVE") {
      throw new ConflictError(
        Message.EMPLOYEE.CCCD_ACTIVE_EXISTS,
        "CCCD_ACTIVE_EXISTS",
      );
    }
    // CCCD đã tồn tại nhưng nhân viên đó đã nghỉ việc -> gợi ý dùng chức năng thuê lại thay vì tạo mới
    throw new ConflictError(
      Message.EMPLOYEE.CCCD_RESIGNED_EXISTS,
      "CCCD_RESIGNED_EXISTS",
      {
        employeeId: existing.id,
      },
    );
  }

  // Kiểm tra vị trí công việc có tồn tại không
  const position = await employeeRepository.findPositionById(positionId);
  if (!position) {
    throw new BadRequestError(
      Message.EMPLOYEE.POSITION_NOT_FOUND,
      "POSITION_NOT_FOUND",
    );
  }

  const code = await employeeRepository.nextCode(); // Sinh mã nhân viên tự động (kiểu tăng dần)
  const employee = await employeeRepository.create({
    code,
    cccdHash,
    fullName,
    dob,
    positionId,
  });

  // Mã hóa CCCD (2 chiều, giải mã được) để lưu vào hồ sơ, phục vụ hiển thị/tra cứu sau này khi cần
  const cccdEncrypted = encrypt(cccd);
  await employeeRepository.upsertProfileCccd(employee.id, cccdEncrypted);
  await employeeRepository.createEmploymentPeriod(employee.id); // Tạo bản ghi giai đoạn gắn bó (bắt đầu làm việc)
  await employeeRepository.createPositionHistory(employee.id, positionId); // Tạo bản ghi lịch sử vị trí ban đầu

  return employee;
}

// Hàm cập nhật thông tin nhân viên
export async function update(
  id: string,
  { fullName, dob, positionId }: UpdateEmployeeInput,
) {
  const employee = await employeeRepository.findById(id);
  if (!employee) {
    throw new NotFoundError(Message.EMPLOYEE.NOT_FOUND, "EMPLOYEE_NOT_FOUND");
  }

  // Nếu có đổi vị trí thì kiểm tra vị trí mới có tồn tại không
  if (positionId) {
    const position = await employeeRepository.findPositionById(positionId);
    if (!position) {
      throw new BadRequestError(
        Message.EMPLOYEE.POSITION_NOT_FOUND,
        "POSITION_NOT_FOUND",
      );
    }
  }

  const updated = await employeeRepository.update(id, {
    fullName,
    dob,
    positionId,
  });

  // Nếu vị trí thực sự thay đổi (khác vị trí cũ) thì đóng lịch sử vị trí cũ và mở bản ghi lịch sử vị trí mới
  if (positionId && positionId !== employee.positionId) {
    await employeeRepository.closeOpenPositionHistory(id);
    await employeeRepository.createPositionHistory(id, positionId);
  }

  return updated;
}

// Hàm xóa nhân viên
export async function remove(id: string): Promise<void> {
  const employee = await employeeRepository.findById(id);
  if (!employee) {
    throw new NotFoundError(Message.EMPLOYEE.NOT_FOUND, "EMPLOYEE_NOT_FOUND");
  }

  try {
    await employeeRepository.remove(id);
  } catch (err) {
    // P2003 = vi phạm ràng buộc khóa ngoại (nhân viên đã có attendance/dailyPayment liên kết)
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2003"
    ) {
      throw new ConflictError(
        Message.EMPLOYEE.HAS_RELATED_DATA,
        "EMPLOYEE_HAS_RELATED_DATA",
      );
    }
    throw err; // Lỗi khác thì ném lại nguyên vẹn, không nuốt lỗi
  }
}

// Hàm cho nhân viên nghỉ việc
export async function resign(id: string) {
  const employee = await employeeRepository.findById(id);
  if (!employee) {
    throw new NotFoundError(Message.EMPLOYEE.NOT_FOUND, "EMPLOYEE_NOT_FOUND");
  }

  // Không cho nghỉ việc nếu đã nghỉ việc rồi (tránh gọi trùng)
  if (employee.status === "RESIGNED") {
    throw new BadRequestError(
      Message.EMPLOYEE.ALREADY_RESIGNED,
      "ALREADY_RESIGNED",
    );
  }

  const updated = await employeeRepository.updateStatus(id, "RESIGNED"); // Đổi trạng thái sang đã nghỉ việc
  await employeeRepository.closeOpenPositionHistory(id); // Đóng lịch sử vị trí đang mở (gắn ngày kết thúc)
  await employeeRepository.closeOpenEmploymentPeriod(id); // Đóng giai đoạn gắn bó đang mở (gắn ngày nghỉ việc)

  return updated;
}

// Hàm thuê lại nhân viên đã nghỉ việc
export async function rehire(id: string, { positionId }: RehireEmployeeInput) {
  const employee = await employeeRepository.findById(id);
  if (!employee) {
    throw new NotFoundError(Message.EMPLOYEE.NOT_FOUND, "EMPLOYEE_NOT_FOUND");
  }

  // Chỉ cho thuê lại nếu nhân viên đang ở trạng thái đã nghỉ việc
  if (employee.status !== "RESIGNED") {
    throw new BadRequestError(Message.EMPLOYEE.NOT_RESIGNED, "NOT_RESIGNED");
  }

  // Nếu có chỉ định vị trí mới khi thuê lại thì kiểm tra vị trí đó có tồn tại không
  if (positionId) {
    const position = await employeeRepository.findPositionById(positionId);
    if (!position) {
      throw new BadRequestError(
        Message.EMPLOYEE.POSITION_NOT_FOUND,
        "POSITION_NOT_FOUND",
      );
    }
  }

  const updated = await employeeRepository.updateStatus(
    id,
    "ACTIVE",
    positionId,
  ); // Đổi trạng thái về đang làm việc (kèm đổi vị trí nếu có)
  await employeeRepository.createEmploymentPeriod(id); // Tạo bản ghi giai đoạn gắn bó mới (bắt đầu lại)
  await employeeRepository.createPositionHistory(
    id,
    positionId ?? employee.positionId,
  ); // Tạo bản ghi lịch sử vị trí mới (dùng vị trí mới nếu có, không thì giữ vị trí cũ)

  return updated;
}
