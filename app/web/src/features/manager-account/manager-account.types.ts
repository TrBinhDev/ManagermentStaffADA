import type { ManagerRole } from "@/features/auth/auth.types";

export interface ManagerAccount {
  id: string;
  email: string;
  role: ManagerRole;
  isActive: boolean;
  employeeId: string | null;
  employee: { fullName: string } | null;
}

export interface ListManagerAccountParams {
  isActive?: boolean;
  role?: ManagerRole;
  page?: number;
  limit?: number;
}

export interface CreateManagerAccountInput {
  email: string;
  password: string;
  role: "MANAGER";
  employeeId?: string;
}

export interface UpdateManagerAccountInput {
  isActive?: boolean;
  email?: string;
}

export interface ResetPasswordInput {
  newPassword: string;
}
