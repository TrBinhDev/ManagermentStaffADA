import { Prisma } from "@prisma/client";
import { Message } from "../../constants/message.js";
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
} from "../../errors/AppError.js";
import { parseDateOnly, combineDateAndTime } from "../../utils/date.util.js";
import * as attendanceRepository from "./attendance.repository.js";
import type { CheckInInput, ListAttendanceQuery } from "./attendance.schema.js";

const MS_PER_HOUR = 60 * 60 * 1000; // Số mili-giây trong 1 giờ, dùng để tính số giờ làm
const AMOUNT_ROUND_UNIT = 1000; // Đơn vị làm tròn tiền lương (làm tròn đến hàng nghìn)
const EARLY_CHECKIN_GRACE_MS = 5 * 60 * 1000; // Cho phép check-in sớm tối đa 5 phút trước giờ ca
const LATE_CHECKIN_GRACE_MS = 15 * 60 * 1000; // Cho phép check-in trễ tối đa 15p sau khi ca kết thúc

// Hàm xử lý check-in cho nhân viên
export async function checkIn(
  { employeeId, shiftId, workDate: workDateStr }: CheckInInput,
  performedById: string,
) {
  // Kiểm tra nhân viên có tồn tại không
  const employee = await attendanceRepository.findEmployeeById(employeeId);
  if (!employee) {
    throw new NotFoundError(
      Message.ATTENDANCE.EMPLOYEE_NOT_FOUND,
      "EMPLOYEE_NOT_FOUND",
    );
  }
  // Kiểm tra nhân viên còn đang làm việc (chưa nghỉ việc)
  if (employee.status !== "ACTIVE") {
    throw new BadRequestError(
      Message.ATTENDANCE.EMPLOYEE_RESIGNED,
      "EMPLOYEE_RESIGNED",
    );
  }

  // Kiểm tra ca làm việc có tồn tại không
  const shift = await attendanceRepository.findShiftById(shiftId);
  if (!shift) {
    throw new BadRequestError(
      Message.ATTENDANCE.SHIFT_NOT_FOUND,
      "SHIFT_NOT_FOUND",
    );
  }

  const workDate = parseDateOnly(workDateStr); // Chuyển chuỗi ngày làm việc thành đối tượng Date

  // Kiểm tra nhân viên có được xếp lịch làm ca này vào ngày này không
  const schedule = await attendanceRepository.findWorkSchedule(
    employeeId,
    shiftId,
    workDate,
  );
  if (!schedule) {
    throw new BadRequestError(
      Message.ATTENDANCE.NO_WORK_SCHEDULE,
      "NO_WORK_SCHEDULE",
    );
  }

  // Ghép ngày làm việc + giờ bắt đầu ca để ra thời điểm bắt đầu ca chính xác
  const shiftStartAt = combineDateAndTime(workDate, shift.startTime);
  // Không cho check-in quá sớm (trước giờ ca trừ đi thời gian ân hạn)
  if (Date.now() < shiftStartAt.getTime() - EARLY_CHECKIN_GRACE_MS) {
    throw new BadRequestError(Message.ATTENDANCE.TOO_EARLY, "TOO_EARLY");
  }

  // Chặn check-in trễ: qua giờ kết thúc ca (+ thời gian ân hạn) thì không cho check-in nữa
  const shiftEndAt = combineDateAndTime(workDate, shift.endTime);
  if (Date.now() > shiftEndAt.getTime() + LATE_CHECKIN_GRACE_MS) {
    throw new BadRequestError(Message.ATTENDANCE.TOO_LATE, "TOO_LATE");
  }

  // Kiểm tra đã check-in ca này trong ngày này chưa (tránh check-in trùng)
  const existing = await attendanceRepository.findExistingAttendance(
    employeeId,
    shiftId,
    workDate,
  );
  if (existing) {
    throw new ConflictError(
      Message.ATTENDANCE.ALREADY_CHECKED_IN,
      "ALREADY_CHECKED_IN",
    );
  }

  // Tạo bản ghi check-in mới
  return attendanceRepository.createCheckIn(
    employeeId,
    shiftId,
    workDate,
    performedById,
  );
}

// Hàm xử lý check-out và tính lương cho nhân viên
export async function checkOut(attendanceId: string, performedById: string) {
  // Kiểm tra bản ghi chấm công có tồn tại không
  const attendance = await attendanceRepository.findById(attendanceId);
  if (!attendance) {
    throw new NotFoundError(
      Message.ATTENDANCE.NOT_FOUND,
      "ATTENDANCE_NOT_FOUND",
    );
  }
  // Phải check-in trước thì mới được check-out
  if (!attendance.checkedInAt) {
    throw new BadRequestError(
      Message.ATTENDANCE.NOT_CHECKED_IN,
      "NOT_CHECKED_IN",
    );
  }
  // Không cho check-out 2 lần
  if (attendance.checkedOutAt) {
    throw new BadRequestError(
      Message.ATTENDANCE.ALREADY_CHECKED_OUT,
      "ALREADY_CHECKED_OUT",
    );
  }

  // Tìm vị trí/chức vụ của nhân viên tại thời điểm check-in (để tính lương đúng vị trí lúc đó)
  const positionHistory = await attendanceRepository.findPositionHistoryAt(
    attendance.employeeId,
    attendance.checkedInAt!,
  );
  if (!positionHistory) {
    throw new BadRequestError(
      Message.ATTENDANCE.NO_POSITION_HISTORY,
      "NO_POSITION_HISTORY",
    );
  }

  // Tìm mức lương theo giờ áp dụng cho vị trí đó tại ngày làm việc
  const salaryRate = await attendanceRepository.findSalaryRateAt(
    positionHistory.positionId,
    attendance.workDate,
  );
  if (!salaryRate) {
    throw new BadRequestError(
      Message.ATTENDANCE.NO_SALARY_RATE,
      "NO_SALARY_RATE",
    );
  }

  const checkedOutAt = new Date(); // Thời điểm check-out (hiện tại)
  // Tính số giờ đã làm = (thời gian check-out - thời gian check-in) / số ms trong 1 giờ
  const hoursWorked = new Prisma.Decimal(
    checkedOutAt.getTime() - attendance.checkedInAt.getTime(),
  ).dividedBy(MS_PER_HOUR);
  const rawAmount = hoursWorked.mul(salaryRate.hourlyRate); // Tiền lương thô = số giờ x đơn giá/giờ
  // Làm tròn tiền lương theo đơn vị AMOUNT_ROUND_UNIT (ví dụ làm tròn đến nghìn đồng)
  const amount = rawAmount
    .dividedBy(AMOUNT_ROUND_UNIT)
    .round()
    .mul(AMOUNT_ROUND_UNIT);

  // Lưu thông tin check-out kèm bản ghi thanh toán lương
  return attendanceRepository.checkOutWithPayment(
    attendanceId,
    performedById,
    checkedOutAt,
    {
      employeeId: attendance.employeeId,
      positionId: positionHistory.positionId,
      workDate: attendance.workDate,
      hoursWorked,
      hourlyRate: salaryRate.hourlyRate,
      amount,
    },
  );
}

// Hàm lấy danh sách chấm công có phân trang và lọc theo nhân viên/khoảng ngày
export async function list({
  employeeId,
  from,
  to,
  page,
  limit,
}: ListAttendanceQuery) {
  const skip = (page - 1) * limit; // Số bản ghi cần bỏ qua để phân trang
  const filters = {
    employeeId,
    from: from ? parseDateOnly(from) : undefined, // Ngày bắt đầu lọc (nếu có)
    to: to ? parseDateOnly(to) : undefined, // Ngày kết thúc lọc (nếu có)
  };

  // Lấy dữ liệu và đếm tổng số bản ghi song song để tối ưu tốc độ
  const [data, total] = await Promise.all([
    attendanceRepository.findMany(filters, skip, limit),
    attendanceRepository.count(filters),
  ]);

  return { data, total, page, limit };
}
