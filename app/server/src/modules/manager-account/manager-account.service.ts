import bcrypt from "bcrypt";
import { Message } from "../../constants/message.js";
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
} from "../../errors/AppError.js";
import { deleteSession } from "../../utils/session.util.js";
import * as managerAccountRepository from "./manager-account.repository.js";
import type {
  ListManagerAccountQuery,
  CreateManagerAccountInput,
  UpdateManagerAccountInput,
  ResetPasswordInput,
} from "./manager-account.schema.js";

const BCRYPT_ROUNDS = 10; // Số vòng lặp hash mật khẩu bằng bcrypt

// Hàm lấy danh sách tài khoản quản lý, có lọc + phân trang
export async function list({
  isActive,
  role,
  page,
  limit,
}: ListManagerAccountQuery) {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    managerAccountRepository.findMany(isActive, role, skip, limit),
    managerAccountRepository.count(isActive, role),
  ]);

  return { data, total, page, limit };
}

// Hàm lấy chi tiết 1 tài khoản theo Id
export async function getById(id: string) {
  const account = await managerAccountRepository.findById(id);
  if (!account) {
    throw new NotFoundError(
      Message.MANAGER_ACCOUNT.NOT_FOUND,
      "MANAGER_ACCOUNT_NOT_FOUND",
    );
  }
  return account;
}

// Hàm tạo mới tài khoản quản lý
export async function create({
  email,
  password,
  role,
  employeeId,
}: CreateManagerAccountInput) {
  // Kiểm tra email đã được dùng chưa
  const existingEmail = await managerAccountRepository.findByEmail(email);
  if (existingEmail) {
    throw new ConflictError(
      Message.MANAGER_ACCOUNT.EMAIL_EXISTS,
      "EMAIL_EXISTS",
    );
  }

  // Nếu có gắn với 1 nhân viên thì kiểm tra thêm các ràng buộc liên quan
  if (employeeId) {
    const employee =
      await managerAccountRepository.findEmployeeById(employeeId);
    if (!employee) {
      throw new BadRequestError(
        Message.MANAGER_ACCOUNT.EMPLOYEE_NOT_FOUND,
        "EMPLOYEE_NOT_FOUND",
      );
    }
    // Không cho gắn tài khoản với nhân viên đã nghỉ việc
    if (employee.status === "RESIGNED") {
      throw new BadRequestError(
        Message.MANAGER_ACCOUNT.EMPLOYEE_RESIGNED,
        "EMPLOYEE_RESIGNED",
      );
    }

    // Mỗi nhân viên chỉ được gắn với 1 tài khoản (do employeeId là unique bên ManagerAccount)
    const existingAccount =
      await managerAccountRepository.findByEmployeeId(employeeId);
    if (existingAccount) {
      throw new ConflictError(
        Message.MANAGER_ACCOUNT.EMPLOYEE_HAS_ACCOUNT,
        "EMPLOYEE_HAS_ACCOUNT",
      );
    }
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  return managerAccountRepository.create({
    email,
    passwordHash,
    role,
    employeeId,
  });
}

// Hàm cập nhật tài khoản quản lý
export async function update(
  id: string,
  { isActive, email, role, employeeId }: UpdateManagerAccountInput,
) {
  const account = await managerAccountRepository.findById(id);
  if (!account) {
    throw new NotFoundError(
      Message.MANAGER_ACCOUNT.NOT_FOUND,
      "MANAGER_ACCOUNT_NOT_FOUND",
    );
  }
  // Không cho sửa tài khoản OWNER qua API này (bảo vệ tài khoản chủ sở hữu)
  if (account.role === "OWNER") {
    throw new BadRequestError(
      Message.MANAGER_ACCOUNT.CANNOT_MODIFY_OWNER,
      "CANNOT_MODIFY_OWNER",
    );
  }

  // Nếu có đổi email thì kiểm tra email mới có bị trùng với tài khoản khác không
  if (email && email !== account.email) {
    const existingEmail = await managerAccountRepository.findByEmail(email);
    if (existingEmail) {
      throw new ConflictError(
        Message.MANAGER_ACCOUNT.EMAIL_EXISTS,
        "EMAIL_EXISTS",
      );
    }
  }

  // Tính ra trạng thái employeeId/role SAU khi cập nhật để kiểm tra ràng buộc STAFF phải có employeeId
  // (employeeId === undefined nghĩa là không đổi -> giữ giá trị cũ; nếu có truyền (kể cả null) thì lấy giá trị mới)
  const nextEmployeeId =
    employeeId === undefined ? account.employeeId : employeeId;
  const nextRole = role ?? account.role;

  if (nextRole === "STAFF" && !nextEmployeeId) {
    throw new BadRequestError(
      Message.MANAGER_ACCOUNT.STAFF_REQUIRES_EMPLOYEE,
      "STAFF_REQUIRES_EMPLOYEE",
    );
  }

  // Nếu có đổi sang 1 employeeId cụ thể (không phải gỡ liên kết) thì kiểm tra nhân viên đó hợp lệ
  if (employeeId) {
    const employee =
      await managerAccountRepository.findEmployeeById(employeeId);
    if (!employee) {
      throw new BadRequestError(
        Message.MANAGER_ACCOUNT.EMPLOYEE_NOT_FOUND,
        "EMPLOYEE_NOT_FOUND",
      );
    }
    if (employee.status === "RESIGNED") {
      throw new BadRequestError(
        Message.MANAGER_ACCOUNT.EMPLOYEE_RESIGNED,
        "EMPLOYEE_RESIGNED",
      );
    }

    // Kiểm tra nhân viên đó chưa bị gắn với tài khoản khác (trừ chính tài khoản đang sửa)
    const existingAccount =
      await managerAccountRepository.findByEmployeeId(employeeId);
    if (existingAccount && existingAccount.id !== id) {
      throw new ConflictError(
        Message.MANAGER_ACCOUNT.EMPLOYEE_HAS_ACCOUNT,
        "EMPLOYEE_HAS_ACCOUNT",
      );
    }
  }

  const updated = await managerAccountRepository.update(id, {
    isActive,
    email,
    role,
    employeeId,
  });

  // Nếu khóa tài khoản, đổi liên kết nhân viên, hoặc đổi vai trò -> hủy session hiện tại
  // (bắt buộc đăng nhập lại để áp dụng quyền/trạng thái mới, tránh dùng token cũ với quyền cũ)
  if (isActive === false || employeeId !== undefined || role !== undefined) {
    await deleteSession(id);
  }

  return updated;
}

// Hàm đặt lại mật khẩu cho tài khoản (do OWNER thực hiện)
export async function resetPassword(
  id: string,
  { newPassword }: ResetPasswordInput,
): Promise<void> {
  const account = await managerAccountRepository.findById(id);
  if (!account) {
    throw new NotFoundError(
      Message.MANAGER_ACCOUNT.NOT_FOUND,
      "MANAGER_ACCOUNT_NOT_FOUND",
    );
  }
  // Không cho đặt lại mật khẩu OWNER qua API này
  if (account.role === "OWNER") {
    throw new BadRequestError(
      Message.MANAGER_ACCOUNT.CANNOT_MODIFY_OWNER,
      "CANNOT_MODIFY_OWNER",
    );
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await managerAccountRepository.updatePasswordHash(id, passwordHash);
  await deleteSession(id); // Hủy session cũ, bắt buộc đăng nhập lại bằng mật khẩu mới
}

// Hàm xóa tài khoản quản lý
export async function remove(id: string): Promise<void> {
  const account = await managerAccountRepository.findById(id);
  if (!account) {
    throw new NotFoundError(
      Message.MANAGER_ACCOUNT.NOT_FOUND,
      "MANAGER_ACCOUNT_NOT_FOUND",
    );
  }
  // Không cho xóa tài khoản OWNER
  if (account.role === "OWNER") {
    throw new BadRequestError(
      Message.MANAGER_ACCOUNT.CANNOT_MODIFY_OWNER,
      "CANNOT_MODIFY_OWNER",
    );
  }

  await managerAccountRepository.remove(id);
  await deleteSession(id); // Hủy session của tài khoản vừa xóa
}
