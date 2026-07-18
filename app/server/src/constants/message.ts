export const Message = {
  COMMON: {
    SERVER_ERROR: "Đã có lỗi xảy ra, vui lòng thử lại sau",
    VALIDATION_ERROR: "Dữ liệu không hợp lệ",
    UNAUTHORIZED: "Bạn cần đăng nhập để thực hiện thao tác này",
    FORBIDDEN: "Bạn không có quyền thực hiện thao tác này",
  },

  AUTH: {
    INVALID_CREDENTIALS: "Email hoặc mật khẩu không đúng",
    INVALID_OLD_PASSWORD: "Mật khẩu cũ không đúng",
    WEAK_PASSWORD: "Mật khẩu phải có ít nhất 8 ký tự, bao gồm cả chữ và số",
  },

  DEPARTMENT: {
    NOT_FOUND: "Không tìm thấy phòng ban",
    NAME_EXISTS: "Tên phòng ban đã tồn tại",
    HAS_POSITIONS:
      "Không thể xóa vì còn vị trí đang tham chiếu tới phòng ban này",
  },

  POSITION: {
    NOT_FOUND: "Không tìm thấy vị trí",
    NAME_EXISTS: "Tên vị trí đã tồn tại",
    DEPARTMENT_NOT_FOUND: "Phòng ban không tồn tại",
    HAS_EMPLOYEES: "Không thể xóa vì vị trí này đã từng có nhân viên đảm nhiệm",
  },

  EMPLOYEE: {
    NOT_FOUND: "Không tìm thấy nhân viên",
    POSITION_NOT_FOUND: "Vị trí không tồn tại",
    CCCD_ACTIVE_EXISTS: "CCCD này đã có nhân viên đang làm việc",
    CCCD_RESIGNED_EXISTS:
      "CCCD này đã từng có nhân viên nhưng đã nghỉ việc, vui lòng dùng chức năng rehire",
    ALREADY_RESIGNED: "Nhân viên đã nghỉ việc trước đó",
    NOT_RESIGNED: "Nhân viên chưa nghỉ việc, không thể rehire",
  },

  EMPLOYEE_PROFILE: {
    INVALID_FILE_TYPE: "Chỉ chấp nhận file .jpg, .jpeg, .png, .webp",
    FILE_TOO_LARGE: "Dung lượng file tối đa 5MB",
    CCCD_REQUIRED: "Cần cung cấp cccd để tạo hồ sơ nhân viên lần đầu",
  },

  MANAGER_ACCOUNT: {
    NOT_FOUND: "Không tìm thấy tài khoản",
    EMAIL_EXISTS: "Email đã được sử dụng",
    EMPLOYEE_NOT_FOUND: "Nhân viên không tồn tại",
    EMPLOYEE_RESIGNED: "Không thể tạo tài khoản cho nhân viên đã nghỉ việc",
    EMPLOYEE_HAS_ACCOUNT: "Nhân viên này đã có tài khoản quản lý khác",
    CANNOT_MODIFY_OWNER: "Không thể chỉnh sửa tài khoản OWNER",
  },
} as const;
