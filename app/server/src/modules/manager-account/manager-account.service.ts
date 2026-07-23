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

const BCRYPT_ROUNDS = 10;

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

export async function create({
  email,
  password,
  role,
  employeeId,
}: CreateManagerAccountInput) {
  const existingEmail = await managerAccountRepository.findByEmail(email);
  if (existingEmail) {
    throw new ConflictError(
      Message.MANAGER_ACCOUNT.EMAIL_EXISTS,
      "EMAIL_EXISTS",
    );
  }

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
  if (account.role === "OWNER") {
    throw new BadRequestError(
      Message.MANAGER_ACCOUNT.CANNOT_MODIFY_OWNER,
      "CANNOT_MODIFY_OWNER",
    );
  }

  if (email && email !== account.email) {
    const existingEmail = await managerAccountRepository.findByEmail(email);
    if (existingEmail) {
      throw new ConflictError(
        Message.MANAGER_ACCOUNT.EMAIL_EXISTS,
        "EMAIL_EXISTS",
      );
    }
  }

  // employeeId undefined = giu nguyen gia tri cu, null = go lien ket, string = doi sang nhan
  // vien khac - phai tinh truoc "gia tri sau khi update" de check dung rang buoc STAFF ben duoi.
  const nextEmployeeId = employeeId === undefined ? account.employeeId : employeeId;
  const nextRole = role ?? account.role;

  if (nextRole === "STAFF" && !nextEmployeeId) {
    throw new BadRequestError(
      Message.MANAGER_ACCOUNT.STAFF_REQUIRES_EMPLOYEE,
      "STAFF_REQUIRES_EMPLOYEE",
    );
  }

  if (employeeId) {
    const employee = await managerAccountRepository.findEmployeeById(employeeId);
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

    const existingAccount = await managerAccountRepository.findByEmployeeId(employeeId);
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

  // Doi employeeId/role thi phai buoc dang xuat - access/refresh token cu van con mang gia
  // tri CU vi refreshSession() khong query lai DB (chi ky lai token tu payload token cu).
  if (isActive === false || employeeId !== undefined || role !== undefined) {
    await deleteSession(id);
  }

  return updated;
}

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
  if (account.role === "OWNER") {
    throw new BadRequestError(
      Message.MANAGER_ACCOUNT.CANNOT_MODIFY_OWNER,
      "CANNOT_MODIFY_OWNER",
    );
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await managerAccountRepository.updatePasswordHash(id, passwordHash);
  await deleteSession(id);
}

export async function remove(id: string): Promise<void> {
  const account = await managerAccountRepository.findById(id);
  if (!account) {
    throw new NotFoundError(
      Message.MANAGER_ACCOUNT.NOT_FOUND,
      "MANAGER_ACCOUNT_NOT_FOUND",
    );
  }
  if (account.role === "OWNER") {
    throw new BadRequestError(
      Message.MANAGER_ACCOUNT.CANNOT_MODIFY_OWNER,
      "CANNOT_MODIFY_OWNER",
    );
  }

  await managerAccountRepository.remove(id);
  await deleteSession(id);
}
