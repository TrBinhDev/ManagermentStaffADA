"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import * as workScheduleApi from "@/features/work-schedule/work-schedule.api";
import type { WorkScheduleSummaryItem } from "@/features/work-schedule/work-schedule.types";
import * as attendanceApi from "@/features/attendance/attendance.api";
import type { AttendanceItem } from "@/features/attendance/attendance.types";
import { useToast } from "@/components/toast/toast-context";
import { getErrorMessage } from "@/lib/error";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function toDateOnly(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const EARLY_CHECKIN_GRACE_MS = 5 * 60 * 1000;
function isTooEarlyToCheckIn(workDate: string, startTime: string) {
  const [year, month, day] = workDate.split("-").map(Number);
  const [hours, minutes] = startTime.split(":").map(Number);
  const shiftStartAt = new Date(year, month - 1, day, hours, minutes);
  return Date.now() < shiftStartAt.getTime() - EARLY_CHECKIN_GRACE_MS;
}

export default function TodayAttendancePage() {
  const toast = useToast();
  const [today] = useState(() => toDateOnly(new Date()));
  const [todayMonth] = useState(() => new Date().getMonth() + 1);
  const [todayYear] = useState(() => new Date().getFullYear());

  const [scheduleRows, setScheduleRows] = useState<WorkScheduleSummaryItem[]>(
    [],
  );
  const [attendanceRows, setAttendanceRows] = useState<AttendanceItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    const [scheduleResult, attendanceResult] = await Promise.all([
      workScheduleApi.fetchAllWorkSchedule(todayMonth, todayYear),
      attendanceApi.fetchAttendance({ from: today, to: today, limit: 100 }),
    ]);
    setScheduleRows(
      scheduleResult.filter((row) => row.workDate.slice(0, 10) === today),
    );
    setAttendanceRows(attendanceResult.data);
    setLoading(false);
  }, [today, todayMonth, todayYear]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount, refetch tu setState ben trong
    refetch();
  }, [refetch]);

  const groups = useMemo(() => {
    const byShift = new Map<
      string,
      {
        shift: WorkScheduleSummaryItem["shift"];
        rows: WorkScheduleSummaryItem[];
      }
    >();
    for (const row of scheduleRows) {
      if (!byShift.has(row.shiftId))
        byShift.set(row.shiftId, { shift: row.shift, rows: [] });
      byShift.get(row.shiftId)!.rows.push(row);
    }
    return Array.from(byShift.values())
      .map((group) => ({
        ...group,
        rows: [...group.rows].sort((a, b) =>
          a.employee.fullName.localeCompare(b.employee.fullName),
        ),
      }))
      .sort((a, b) => a.shift.startTime.localeCompare(b.shift.startTime));
  }, [scheduleRows]);

  function findAttendance(employeeId: string, shiftId: string) {
    return attendanceRows.find(
      (a) => a.employeeId === employeeId && a.shiftId === shiftId,
    );
  }

  async function handleCheckIn(employeeId: string, shiftId: string) {
    try {
      await attendanceApi.checkIn({ employeeId, shiftId, workDate: today });
      toast.success("Đã chấm công vào");
      await refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function handleCheckOut(attendanceId: string) {
    try {
      await attendanceApi.checkOut(attendanceId);
      toast.success("Đã chấm công ra, đã tính lương ngày này");
      await refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Chấm công hôm nay</h1>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString("vi-VN", {
            weekday: "long",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Chi an noi dung o lan tai dau tien (groups rong) - tu lan refetch thu 2 tro di (sau
          khi cham cong vao/ra) giu nguyen bang cu hien thi, tranh giat/nhap nhay ca trang. */}
      {loading && groups.length === 0 && <p className="text-sm text-muted-foreground">Đang tải...</p>}
      {!loading && groups.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Hôm nay chưa có ai được xếp lịch làm việc.
        </p>
      )}

      {groups.length > 0 &&
        groups.map(({ shift, rows }) => {
          const tooEarly = isTooEarlyToCheckIn(today, shift.startTime);
          return (
          <div
            key={shift.id}
            className="space-y-2 rounded-xl border border-border bg-card p-4 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold">{shift.name}</h2>
              <Badge variant="secondary">
                {shift.startTime}–{shift.endTime}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {rows.length} nhân viên
              </span>
            </div>

            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Nhân viên</TableHead>
                  <TableHead className="w-28 text-center">Giờ vào</TableHead>
                  <TableHead className="w-28 text-center">Giờ ra</TableHead>
                  <TableHead className="w-40" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const attendance = findAttendance(
                    row.employeeId,
                    row.shiftId,
                  );
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="truncate">
                        {row.employee.code} — {row.employee.fullName}
                      </TableCell>
                      <TableCell className="text-center tabular-nums">
                        {attendance?.checkedInAt ? (
                          new Date(attendance.checkedInAt).toLocaleTimeString(
                            "vi-VN",
                          )
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center tabular-nums">
                        {attendance?.checkedOutAt ? (
                          new Date(attendance.checkedOutAt).toLocaleTimeString(
                            "vi-VN",
                          )
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {!attendance && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={tooEarly}
                            title={
                              tooEarly
                                ? "Chưa tới giờ chấm công, được phép trước giờ vào ca 5 phút"
                                : undefined
                            }
                            onClick={() =>
                              handleCheckIn(row.employeeId, row.shiftId)
                            }
                          >
                            Chấm công vào
                          </Button>
                        )}
                        {attendance && !attendance.checkedOutAt && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCheckOut(attendance.id)}
                          >
                            Chấm công ra
                          </Button>
                        )}
                        {attendance?.checkedOutAt && (
                          <Badge variant="secondary">Hoàn tất</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          );
        })}
    </div>
  );
}
