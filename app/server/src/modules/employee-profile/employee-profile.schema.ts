import { z } from "zod";

// Validate dữ liệu tạo/cập nhật hồ sơ chi tiết nhân viên (upsert: có thì update, chưa có thì create)
// Tất cả trường đều tùy chọn -> cho phép cập nhật từng phần (partial update)
export const upsertEmployeeProfileSchema = z.object({
  cccd: z
    .string()
    .regex(/^\d{12}$/, "CCCD phải gồm đúng 12 chữ số")
    .optional(), // CCCD, nếu có thì phải đúng 12 chữ số
  gender: z.string().trim().max(20, "Giới tính tối đa 20 ký tự").optional(), // Giới tính
  ethnicity: z.string().trim().max(50, "Dân tộc tối đa 50 ký tự").optional(), // Dân tộc
  religion: z.string().trim().max(50, "Tôn giáo tối đa 50 ký tự").optional(), // Tôn giáo
  permanentAddress: z
    .string()
    .trim()
    .max(255, "Địa chỉ thường trú tối đa 255 ký tự")
    .optional(), // Địa chỉ thường trú
  currentAddress: z
    .string()
    .trim()
    .max(255, "Địa chỉ hiện tại tối đa 255 ký tự")
    .optional(), // Địa chỉ hiện tại
  primaryPhone: z
    .string()
    .trim()
    .max(20, "Số điện thoại tối đa 20 ký tự")
    .optional(), // Số điện thoại chính
  email: z
    .string()
    .trim()
    .email("Email không hợp lệ")
    .max(255, "Email tối đa 255 ký tự")
    .optional(), // Email, nếu có thì phải đúng định dạng
  emergencyContactName: z
    .string()
    .trim()
    .max(20, "Tên người liên hệ khẩn cấp tối đa 20 ký tự")
    .optional(), // Tên người liên hệ khẩn cấp
  emergencyContactPhone: z
    .string()
    .trim()
    .max(20, "SĐT người liên hệ khẩn cấp tối đa 20 ký tự")
    .optional(), // SĐT người liên hệ khẩn cấp
  emergencyContactRelation: z
    .string()
    .trim()
    .max(30, "Quan hệ tối đa 30 ký tự")
    .optional(), // Quan hệ với người liên hệ khẩn cấp
  maritalStatus: z
    .string()
    .trim()
    .max(20, "Tình trạng hôn nhân tối đa 20 ký tự")
    .optional(), // Tình trạng hôn nhân
  educationLevel: z
    .string()
    .trim()
    .max(50, "Trình độ học vấn tối đa 50 ký tự")
    .optional(), // Trình độ học vấn
  cccdIssueDate: z.coerce.date().optional(), // Ngày cấp CCCD, tự ép kiểu từ string sang Date
  cccdIssuePlace: z
    .string()
    .trim()
    .max(255, "Nơi cấp CCCD tối đa 255 ký tự")
    .optional(), // Nơi cấp CCCD
  bankName: z
    .string()
    .trim()
    .max(50, "Tên ngân hàng tối đa 50 ký tự")
    .optional(), // Tên ngân hàng
  bankAccountNumber: z
    .string()
    .trim()
    .max(50, "Số tài khoản tối đa 50 ký tự")
    .optional(), // Số tài khoản ngân hàng
  bankAccountHolder: z
    .string()
    .trim()
    .max(50, "Tên chủ tài khoản tối đa 50 ký tự")
    .optional(), // Tên chủ tài khoản ngân hàng
  note: z.string().max(110, "Ghi chú tối đa 110 ký tự").optional(), // Ghi chú thêm (không trim vì có thể là văn bản dài, nhiều dòng)
});
export type UpsertEmployeeProfileInput = z.infer<
  typeof upsertEmployeeProfileSchema
>; // Type suy ra tự động từ schema
