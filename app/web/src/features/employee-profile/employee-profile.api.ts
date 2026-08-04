import { apiClient } from "@/lib/axios";
import type {
  EmployeeProfile,
  UpsertEmployeeProfileInput,
} from "./employee-profile.types";

export async function fetchProfile(
  employeeId: string,
): Promise<EmployeeProfile | null> {
  const res = await apiClient.get<EmployeeProfile | null>(
    `/employees/${employeeId}/profile`,
  );
  return res.data;
}

export async function upsertProfile(
  employeeId: string,
  input: UpsertEmployeeProfileInput,
): Promise<EmployeeProfile> {
  const res = await apiClient.put<EmployeeProfile>(
    `/employees/${employeeId}/profile`,
    input,
  );
  return res.data;
}

export async function uploadAvatar(
  employeeId: string,
  file: File,
): Promise<EmployeeProfile> {
  const formData = new FormData();
  formData.append("avatar", file);
  const res = await apiClient.put<EmployeeProfile>(
    `/employees/${employeeId}/avatar`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return res.data;
}
