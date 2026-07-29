import { z } from "zod";

// Regex kiểm tra định dạng ngày YYYY-MM-DD
const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// Validate query khi nhân viên tự xem lịch sử chấm công của chính mình (lọc + phân trang)
export const meAttendanceQuerySchema = z.object({
  from: z
    .string()
    .regex(DATE_ONLY_REGEX, "Ngày không hợp lệ (định dạng YYYY-MM-DD)")
    .optional(), // Lọc từ ngày, không bắt buộc
  to: z
    .string()
    .regex(DATE_ONLY_REGEX, "Ngày không hợp lệ (định dạng YYYY-MM-DD)")
    .optional(), // Lọc đến ngày, không bắt buộc
  page: z.coerce.number().int().min(1).default(1), // Số trang, mặc định trang 1
  limit: z.coerce.number().int().min(1).max(100).default(20), // Số bản ghi mỗi trang, tối đa 100, mặc định 20
});
export type MeAttendanceQuery = z.infer<typeof meAttendanceQuerySchema>; // Type suy ra tự động từ schema

// Validate dữ liệu khi nhân viên tự cập nhật hồ sơ cá nhân của chính mình
// Lưu ý: không có cccd, cccdIssueDate, cccdIssuePlace, note -> đây là các trường nhạy cảm/quản trị,
// nhân viên KHÔNG được tự sửa, chỉ OWNER/MANAGER mới có quyền sửa qua employee-profile module
export const meUpdateProfileSchema = z.object({
  gender: z.string().trim().optional(), // Giới tính
  ethnicity: z.string().trim().optional(), // Dân tộc
  religion: z.string().trim().optional(), // Tôn giáo
  permanentAddress: z.string().trim().optional(), // Địa chỉ thường trú
  currentAddress: z.string().trim().optional(), // Địa chỉ hiện tại
  primaryPhone: z.string().trim().optional(), // Số điện thoại
  email: z.string().email("Email không hợp lệ").optional(), // Email
  emergencyContactName: z.string().trim().optional(), // Tên người liên hệ khẩn cấp
  emergencyContactPhone: z.string().trim().optional(), // SĐT người liên hệ khẩn cấp
  emergencyContactRelation: z.string().trim().optional(), // Quan hệ với người liên hệ khẩn cấp
  maritalStatus: z.string().trim().optional(), // Tình trạng hôn nhân
  educationLevel: z.string().trim().optional(), // Trình độ học vấn
  bankName: z.string().trim().optional(), // Tên ngân hàng
  bankAccountNumber: z.string().trim().optional(), // Số tài khoản ngân hàng
  bankAccountHolder: z.string().trim().optional(), // Tên chủ tài khoản ngân hàng
});
export type MeUpdateProfileInput = z.infer<typeof meUpdateProfileSchema>; // Type suy ra tự động từ schema
