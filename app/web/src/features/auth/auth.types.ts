export type ManagerRole = "OWNER" | "MANAGER";

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  role: ManagerRole;
}

export interface Me {
  id: string;
  email: string;
  role: ManagerRole;
  employeeId: string | null;
}

export interface ChangePasswordInput {
  oldPassword: string;
  newPassword: string;
}
