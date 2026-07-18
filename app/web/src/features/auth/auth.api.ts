import { apiClient } from "@/lib/axios";
import type { LoginInput, LoginResponse, Me, ChangePasswordInput } from "./auth.types";

export async function login(input: LoginInput): Promise<LoginResponse> {
  const res = await apiClient.post<LoginResponse>("/auth/login", input);
  return res.data;
}

export async function logout(): Promise<void> {
  await apiClient.post("/auth/logout");
}

export async function refresh(): Promise<{ token: string }> {
  const res = await apiClient.post<{ token: string }>("/auth/refresh");
  return res.data;
}

export async function me(): Promise<Me> {
  const res = await apiClient.get<Me>("/auth/me");
  return res.data;
}

export async function changePassword(input: ChangePasswordInput): Promise<void> {
  await apiClient.patch("/auth/change-password", input);
}
