import { Message } from "../../constants/message.js";
import { BadRequestError, NotFoundError } from "../../errors/AppError.js";
import { monthRangeUTC, parseDateOnly } from "../../utils/date.util.js";
import { findExistingAttendance } from "../attendance/attendance.repository.js";
import * as workScheduleRepository from "./work-schedule.repository.js";
import type {
  ListEmployeeWorkScheduleQuery,
  ListAllWorkScheduleQuery,
  BulkCreateWorkScheduleInput,
  UpdateWorkScheduleInput,
} from "./work-schedule.schema.js";

// Hàm lấy lịch làm việc của 1 nhân viên trong tháng
export async function listByEmployee(
  employeeId: string,
  { month, year }: ListEmployeeWorkScheduleQuery,
) {
  const employee = await workScheduleRepository.findEmployeeById(employeeId);
  if (!employee) {
    throw new NotFoundError(
      Message.WORK_SCHEDULE.EMPLOYEE_NOT_FOUND,
      "EMPLOYEE_NOT_FOUND",
    );
  }

  const { start, end } = monthRangeUTC(year, month);
  return workScheduleRepository.findByEmployeeAndRange(employeeId, start, end);
}

// Hàm lấy lịch làm việc tổng hợp của tất cả nhân viên trong tháng, có thể lọc theo ca
export async function listAll({
  month,
  year,
  shiftId,
}: ListAllWorkScheduleQuery) {
  const { start, end } = monthRangeUTC(year, month);
  return workScheduleRepository.findAllByRange(start, end, shiftId);
}

// Hàm xếp lịch hàng loạt: 1 nhân viên, 1 ca, nhiều ngày cùng lúc
export async function bulkCreate(
  employeeId: string,
  { shiftId, workDates }: BulkCreateWorkScheduleInput,
) {
  const employee = await workScheduleRepository.findEmployeeById(employeeId);
  if (!employee) {
    throw new NotFoundError(
      Message.WORK_SCHEDULE.EMPLOYEE_NOT_FOUND,
      "EMPLOYEE_NOT_FOUND",
    );
  }
  // Không cho xếp lịch cho nhân viên đã nghỉ việc
  if (employee.status !== "ACTIVE") {
    throw new BadRequestError(
      Message.WORK_SCHEDULE.EMPLOYEE_RESIGNED,
      "EMPLOYEE_RESIGNED",
    );
  }

  const shift = await workScheduleRepository.findShiftById(shiftId);
  if (!shift) {
    throw new BadRequestError(
      Message.WORK_SCHEDULE.SHIFT_NOT_FOUND,
      "SHIFT_NOT_FOUND",
    );
  }

  // Lấy giới hạn số người cho cặp (ca, vị trí của nhân viên) — nếu không có cấu hình thì coi như không giới hạn
  const capacity = await workScheduleRepository.findCapacity(
    shiftId,
    employee.positionId,
  );

  const created: string[] = []; // Danh sách ngày xếp lịch thành công (hoặc đã tồn tại sẵn)
  const rejected: string[] = []; // Danh sách ngày bị từ chối do đã đủ người

  // Xử lý tuần tự từng ngày (không dùng Promise.all) vì cần đếm số người hiện tại trước khi quyết định có xếp thêm được không,
  // xử lý song song sẽ dẫn tới đếm sai (race condition) khi nhiều ngày cùng cạnh tranh chung 1 giới hạn
  for (const dateStr of workDates) {
    const workDate = parseDateOnly(dateStr);

    // Nếu nhân viên đã có lịch cho đúng ca + ngày này rồi thì coi như thành công luôn (không tạo trùng, không tính vào rejected)
    const existing = await workScheduleRepository.findExisting(
      employeeId,
      shiftId,
      workDate,
    );
    if (existing) {
      created.push(dateStr);
      continue;
    }

    // Nếu có giới hạn số người, kiểm tra đã đủ người chưa trước khi xếp thêm
    if (capacity) {
      const count = await workScheduleRepository.countSamePositionInShift(
        shiftId,
        workDate,
        employee.positionId,
      );
      if (count >= capacity.maxStaff) {
        rejected.push(dateStr);
        continue;
      }
    }

    await workScheduleRepository.create(employeeId, shiftId, workDate);
    created.push(dateStr);
  }

  return { created, rejected };
}

// Hàm đổi ca cho 1 bản ghi lịch làm việc đã có
export async function updateShift(
  scheduleId: string,
  employeeId: string,
  { shiftId }: UpdateWorkScheduleInput,
) {
  const schedule = await workScheduleRepository.findScheduleById(scheduleId);
  // Kiểm tra bản ghi tồn tại VÀ đúng thuộc về nhân viên đang thao tác (chặn sửa chéo dữ liệu nhân viên khác)
  if (!schedule || schedule.employeeId !== employeeId) {
    throw new NotFoundError(
      Message.WORK_SCHEDULE.NOT_FOUND,
      "WORK_SCHEDULE_NOT_FOUND",
    );
  }

  const shift = await workScheduleRepository.findShiftById(shiftId);
  if (!shift) {
    throw new BadRequestError(
      Message.WORK_SCHEDULE.SHIFT_NOT_FOUND,
      "SHIFT_NOT_FOUND",
    );
  }

  const employee = await workScheduleRepository.findEmployeeById(employeeId);
  if (!employee) {
    throw new NotFoundError(
      Message.WORK_SCHEDULE.EMPLOYEE_NOT_FOUND,
      "EMPLOYEE_NOT_FOUND",
    );
  }

  // Kiểm tra ca mới có còn chỗ trống không (cùng ngày, cùng vị trí)
  const capacity = await workScheduleRepository.findCapacity(
    shiftId,
    employee.positionId,
  );
  if (capacity) {
    // Loại trừ chính bản ghi đang sửa (scheduleId) ra khỏi số đếm, tránh tự đếm chính mình gây sai lệch
    const count = await workScheduleRepository.countSamePositionInShift(
      shiftId,
      schedule.workDate,
      employee.positionId,
      scheduleId,
    );
    if (count >= capacity.maxStaff) {
      throw new BadRequestError(Message.WORK_SCHEDULE.SHIFT_FULL, "SHIFT_FULL");
    }
  }

  return workScheduleRepository.updateShift(scheduleId, shiftId);
}

// Hàm gỡ 1 bản ghi lịch làm việc
export async function remove(
  scheduleId: string,
  employeeId: string,
): Promise<void> {
  const schedule = await workScheduleRepository.findScheduleById(scheduleId);
  // Kiểm tra bản ghi tồn tại VÀ đúng thuộc về nhân viên đang thao tác
  if (!schedule || schedule.employeeId !== employeeId) {
    throw new NotFoundError(
      Message.WORK_SCHEDULE.NOT_FOUND,
      "WORK_SCHEDULE_NOT_FOUND",
    );
  }

  // Không cho gỡ lịch nếu nhân viên đã chấm công cho đúng ca/ngày này rồi
  // (khớp với comment ở WorkScheduleTab.tsx đã xem trước: "khoa sua/go, dong bo voi rang buoc server")
  const attendance = await findExistingAttendance(
    schedule.employeeId,
    schedule.shiftId,
    schedule.workDate,
  );
  if (attendance) {
    throw new BadRequestError(
      Message.WORK_SCHEDULE.HAS_ATTENDANCE,
      "WORK_SCHEDULE_HAS_ATTENDANCE",
    );
  }

  await workScheduleRepository.remove(scheduleId);
}
