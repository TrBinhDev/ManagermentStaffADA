import { isAxiosError } from "axios";
import type { ApiErrorBody } from "@/types/api";

export function getErrorMessage(err: unknown, fallback = "Đã có lỗi xảy ra, vui lòng thử lại"): string {
  if (isAxiosError<ApiErrorBody>(err)) {
    return err.response?.data?.error?.message ?? fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
