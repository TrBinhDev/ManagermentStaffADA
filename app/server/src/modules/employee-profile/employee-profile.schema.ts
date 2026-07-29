import { z } from "zod";

// Validate dữ liệu tạo/cập nhật hồ sơ chi tiết nhân viên (upsert: có thì update, chưa có thì create)
// Tất cả trường đều tùy chọn -> cho phép cập nhật từng phần (partial update)
export const upsertEmployeeProfileSchema = z.object({
  cccd: z
    .string()
    .regex(/^\d{12}$/, "CCCD phải gồm đúng 12 chữ số")
    .optional(), // CCCD, nếu có thì phải đúng 12 chữ số
  gender: z.string().trim().optional(), // Giới tính
  ethnicity: z.string().trim().optional(), // Dân tộc
  religion: z.string().trim().optional(), // Tôn giáo
  permanentAddress: z.string().trim().optional(), // Địa chỉ thường trú
  currentAddress: z.string().trim().optional(), // Địa chỉ hiện tại
  primaryPhone: z.string().trim().optional(), // Số điện thoại chính
  email: z.string().email("Email không hợp lệ").optional(), // Email, nếu có thì phải đúng định dạng
  emergencyContactName: z.string().trim().optional(), // Tên người liên hệ khẩn cấp
  emergencyContactPhone: z.string().trim().optional(), // SĐT người liên hệ khẩn cấp
  emergencyContactRelation: z.string().trim().optional(), // Quan hệ với người liên hệ khẩn cấp
  maritalStatus: z.string().trim().optional(), // Tình trạng hôn nhân
  educationLevel: z.string().trim().optional(), // Trình độ học vấn
  cccdIssueDate: z.coerce.date().optional(), // Ngày cấp CCCD, tự ép kiểu từ string sang Date
  cccdIssuePlace: z.string().trim().optional(), // Nơi cấp CCCD
  bankName: z.string().trim().optional(), // Tên ngân hàng
  bankAccountNumber: z.string().trim().optional(), // Số tài khoản ngân hàng
  bankAccountHolder: z.string().trim().optional(), // Tên chủ tài khoản ngân hàng
  note: z.string().optional(), // Ghi chú thêm (không trim vì có thể là văn bản dài, nhiều dòng)
});
export type UpsertEmployeeProfileInput = z.infer<
  typeof upsertEmployeeProfileSchema
>; // Type suy ra tự động từ schema
