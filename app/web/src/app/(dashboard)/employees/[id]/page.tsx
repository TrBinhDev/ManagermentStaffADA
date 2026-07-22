"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/features/auth/auth.store";
import * as employeeApi from "@/features/employee/employee.api";
import type { EmployeeDetail } from "@/features/employee/employee.types";
import { useEmployeeProfile } from "@/features/employee-profile/use-employee-profile";
import * as employeeProfileApi from "@/features/employee-profile/employee-profile.api";
import type { UpsertEmployeeProfileInput } from "@/features/employee-profile/employee-profile.types";
import { usePositionHistory } from "@/features/position-history/use-position-history";
import { useEmploymentPeriods } from "@/features/employment-period/use-employment-period";
import * as workScheduleApi from "@/features/work-schedule/work-schedule.api";
import type { EmployeeWorkScheduleItem } from "@/features/work-schedule/work-schedule.types";
import { useShiftStore } from "@/features/shift/shift.store";
import * as attendanceApi from "@/features/attendance/attendance.api";
import type { AttendanceItem } from "@/features/attendance/attendance.types";
import * as dailyPaymentApi from "@/features/daily-payment/daily-payment.api";
import type { DailyPaymentItem } from "@/features/daily-payment/daily-payment.types";
import { useToast } from "@/components/toast/toast-context";
import { useConfirm } from "@/components/confirm/confirm-context";
import { getErrorMessage } from "@/lib/error";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "info", label: "Thông tin" },
  { key: "profile", label: "Hồ sơ" },
  { key: "position-history", label: "Lịch sử vị trí" },
  { key: "employment-period", label: "Lịch sử gắn bó" },
  { key: "work-schedule", label: "Lịch làm việc" },
  { key: "attendance", label: "Chấm công" },
  { key: "payments", label: "Lương" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [tab, setTab] = useState<TabKey>("info");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link
          href={ROUTES.employees}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Quay lại
        </Link>
      </div>

      <h1 className="text-xl font-semibold">Chi tiết nhân viên</h1>

      <div className="flex gap-1 border-b">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "border-b-2 border-transparent px-3 py-2 text-sm text-muted-foreground hover:text-foreground",
              tab === t.key && "border-primary font-medium text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "info" && <InfoTab employeeId={id} />}
      {tab === "profile" && <ProfileTab employeeId={id} />}
      {tab === "position-history" && <PositionHistoryTab employeeId={id} />}
      {tab === "employment-period" && <EmploymentPeriodTab employeeId={id} />}
      {tab === "work-schedule" && <WorkScheduleTab employeeId={id} />}
      {tab === "attendance" && <AttendanceTab employeeId={id} />}
      {tab === "payments" && <PaymentsTab employeeId={id} />}
    </div>
  );
}

function InfoTab({ employeeId }: { employeeId: string }) {
  const toast = useToast();
  const confirm = useConfirm();
  const currentEmployeeId = useAuthStore((s) => s.user?.employeeId ?? null);
  const isSelf = employeeId === currentEmployeeId;
  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    const result = await employeeApi.fetchEmployeeById(employeeId);
    setEmployee(result);
    setLoading(false);
  }, [employeeId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount, refetch tu setState ben trong
    refetch();
  }, [refetch]);

  if (loading || !employee) return <p className="text-sm text-muted-foreground">Đang tải...</p>;

  return (
    <div className="max-w-md space-y-3 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">{employee.fullName}</p>
          <p className="text-sm text-muted-foreground">{employee.code}</p>
        </div>
        <Badge variant={employee.status === "ACTIVE" ? "default" : "secondary"}>
          {employee.status === "ACTIVE" ? "Đang làm" : "Đã nghỉ"}
        </Badge>
      </div>

      <div className="space-y-1 text-sm">
        <p>
          <span className="text-muted-foreground">Vị trí: </span>
          {employee.position.name}
        </p>
        <p>
          <span className="text-muted-foreground">Phòng ban: </span>
          {employee.position.department.name}
        </p>
        {employee.dob && (
          <p>
            <span className="text-muted-foreground">Ngày sinh: </span>
            {new Date(employee.dob).toLocaleDateString("vi-VN")}
          </p>
        )}
      </div>

      <div className="flex gap-2 pt-2">
        {employee.status === "ACTIVE" ? (
          !isSelf && (
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              const ok = await confirm({
                title: "Cho nghỉ việc",
                description: `Bạn có chắc chắn muốn cho "${employee.fullName}" nghỉ việc không?`,
                confirmLabel: "Cho nghỉ việc",
                destructive: true,
              });
              if (!ok) return;

              try {
                await employeeApi.resignEmployee(employeeId);
                toast.success("Đã cho nhân viên nghỉ việc");
                refetch();
              } catch (err) {
                toast.error(getErrorMessage(err));
              }
            }}
          >
            Cho nghỉ việc
          </Button>
          )
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                await employeeApi.rehireEmployee(employeeId);
                toast.success("Đã thuê lại nhân viên");
                refetch();
              } catch (err) {
                toast.error(getErrorMessage(err));
              }
            }}
          >
            Thuê lại
          </Button>
        )}
      </div>
    </div>
  );
}

function ProfileTab({ employeeId }: { employeeId: string }) {
  const toast = useToast();
  const { data: profile, loading, refetch } = useEmployeeProfile(employeeId);
  const [form, setForm] = useState<UpsertEmployeeProfileInput>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- dong bo form khi profile tu API load xong
      setForm({
        cccd: profile.cccd,
        gender: profile.gender ?? undefined,
        ethnicity: profile.ethnicity ?? undefined,
        religion: profile.religion ?? undefined,
        permanentAddress: profile.permanentAddress ?? undefined,
        currentAddress: profile.currentAddress ?? undefined,
        primaryPhone: profile.primaryPhone ?? undefined,
        email: profile.email ?? undefined,
        emergencyContactName: profile.emergencyContactName ?? undefined,
        emergencyContactPhone: profile.emergencyContactPhone ?? undefined,
        emergencyContactRelation: profile.emergencyContactRelation ?? undefined,
        maritalStatus: profile.maritalStatus ?? undefined,
        educationLevel: profile.educationLevel ?? undefined,
        cccdIssuePlace: profile.cccdIssuePlace ?? undefined,
        bankName: profile.bankName ?? undefined,
        bankAccountNumber: profile.bankAccountNumber ?? undefined,
        bankAccountHolder: profile.bankAccountHolder ?? undefined,
        note: profile.note ?? undefined,
      });
    }
  }, [profile]);

  function set<K extends keyof UpsertEmployeeProfileInput>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await employeeProfileApi.upsertProfile(employeeId, form);
      toast.success("Đã lưu hồ sơ");
      refetch();
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Đang tải...</p>;

  const fields: Array<{ key: keyof UpsertEmployeeProfileInput; label: string }> = [
    { key: "cccd", label: "CCCD" },
    { key: "gender", label: "Giới tính" },
    { key: "ethnicity", label: "Dân tộc" },
    { key: "religion", label: "Tôn giáo" },
    { key: "permanentAddress", label: "Địa chỉ thường trú" },
    { key: "currentAddress", label: "Địa chỉ hiện tại" },
    { key: "primaryPhone", label: "Số điện thoại" },
    { key: "email", label: "Email" },
    { key: "emergencyContactName", label: "Người liên hệ khẩn cấp" },
    { key: "emergencyContactPhone", label: "SĐT liên hệ khẩn cấp" },
    { key: "emergencyContactRelation", label: "Quan hệ" },
    { key: "maritalStatus", label: "Tình trạng hôn nhân" },
    { key: "educationLevel", label: "Trình độ học vấn" },
    { key: "cccdIssuePlace", label: "Nơi cấp CCCD" },
    { key: "bankName", label: "Ngân hàng" },
    { key: "bankAccountNumber", label: "Số tài khoản" },
    { key: "bankAccountHolder", label: "Chủ tài khoản" },
    { key: "note", label: "Ghi chú" },
  ];

  return (
    <div className="max-w-2xl space-y-4 rounded-lg border p-4">
      <div className="grid grid-cols-2 gap-3">
        {fields.map(({ key, label }) => (
          <div key={key} className="space-y-1">
            <Label htmlFor={key}>{label}</Label>
            <Input
              id={key}
              value={form[key] ?? ""}
              onChange={(e) => set(key, e.target.value)}
              maxLength={key === "cccd" ? 12 : undefined}
            />
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button onClick={handleSave} disabled={saving}>
        {saving ? "Đang lưu..." : "Lưu hồ sơ"}
      </Button>
    </div>
  );
}

function PositionHistoryTab({ employeeId }: { employeeId: string }) {
  const { data, loading } = usePositionHistory(employeeId);

  if (loading) return <p className="text-sm text-muted-foreground">Đang tải...</p>;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Vị trí</TableHead>
          <TableHead>Từ ngày</TableHead>
          <TableHead>Đến ngày</TableHead>
          <TableHead>Số ngày</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row) => (
          <TableRow key={row.id}>
            <TableCell>{row.position.name}</TableCell>
            <TableCell>{new Date(row.startDate).toLocaleDateString("vi-VN")}</TableCell>
            <TableCell>{row.endDate ? new Date(row.endDate).toLocaleDateString("vi-VN") : "Đang giữ"}</TableCell>
            <TableCell>{row.days}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function WorkScheduleTab({ employeeId }: { employeeId: string }) {
  const toast = useToast();
  const confirm = useConfirm();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [schedule, setSchedule] = useState<EmployeeWorkScheduleItem[]>([]);
  const [attendedKeys, setAttendedKeys] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const shifts = useShiftStore((s) => s.data);
  const fetchShifts = useShiftStore((s) => s.fetchAll);

  const [bulkShiftId, setBulkShiftId] = useState("");
  const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set());
  const [bulkError, setBulkError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    const lastDay = new Date(year, month, 0).getDate();
    const from = `${year}-${String(month).padStart(2, "0")}-01`;
    const to = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    const [result, attendance] = await Promise.all([
      workScheduleApi.fetchEmployeeWorkSchedule(employeeId, month, year),
      attendanceApi.fetchAttendance({ employeeId, from, to, limit: 100 }),
    ]);
    setSchedule(result);
    // Da co Attendance (tao ra ngay khi check-in) cho dung ca/ngay nay -> khoa sua/go, dong bo
    // voi rang buoc server moi them o work-schedule.service.ts::remove().
    setAttendedKeys(new Set(attendance.data.map((a) => `${a.shiftId}|${a.workDate.slice(0, 10)}`)));
    setLoading(false);
  }, [employeeId, month, year]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount/thay-doi-thang, refetch tu setState ben trong
    refetch();
  }, [refetch]);

  useEffect(() => {
    fetchShifts({ isActive: true, limit: 100 });
  }, [fetchShifts]);

  useEffect(() => {
    // Doi thang/nam thi cac so ngay dang chon (theo thang cu) khong con y nghia nua.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset selection khi doi filter thang/nam
    setSelectedDays(new Set());
  }, [month, year]);

  const daysInMonth = new Date(year, month, 0).getDate();
  const todayDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  function isPastDay(day: number) {
    return new Date(year, month - 1, day) < todayDateOnly;
  }

  function isPastWorkDate(workDate: string) {
    const d = new Date(workDate);
    const workDateUTC = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    const todayUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    return workDateUTC < todayUTC;
  }

  function toggleDay(day: number) {
    setSelectedDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  }

  function formatDate(day: number) {
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  async function handleBulkCreate() {
    if (!bulkShiftId || selectedDays.size === 0) {
      setBulkError("Chọn ca và ít nhất 1 ngày");
      return;
    }
    setBulkError(null);
    try {
      const workDates = Array.from(selectedDays)
        .sort((a, b) => a - b)
        .map(formatDate);
      const result = await workScheduleApi.bulkCreateWorkSchedule(employeeId, { shiftId: bulkShiftId, workDates });
      if (result.rejected.length > 0) {
        toast.error(`Đã xếp ${result.created.length} ngày, ${result.rejected.length} ngày bị từ chối (đã đủ người)`);
      } else {
        toast.success(`Đã xếp ${result.created.length} ngày`);
      }
      setSelectedDays(new Set());
      await refetch();
    } catch (err) {
      setBulkError(getErrorMessage(err));
    }
  }

  async function handleChangeShift(scheduleId: string, shiftId: string) {
    try {
      await workScheduleApi.updateWorkSchedule(employeeId, scheduleId, { shiftId });
      toast.success("Đã đổi ca");
      await refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function handleDelete(scheduleId: string) {
    const ok = await confirm({
      title: "Gỡ lịch làm việc",
      description: "Bạn có chắc chắn muốn gỡ ngày làm việc này không?",
      confirmLabel: "Gỡ",
      destructive: true,
    });
    if (!ok) return;

    try {
      await workScheduleApi.deleteWorkSchedule(employeeId, scheduleId);
      toast.success("Đã gỡ lịch làm việc");
      await refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Tháng</p>
          <Input
            type="number"
            min="1"
            max="12"
            className="w-20"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          />
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Năm</p>
          <Input
            type="number"
            className="w-24"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ngày</TableHead>
            <TableHead>Ca</TableHead>
            <TableHead className="w-72" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {schedule.map((row) => {
            const past = isPastWorkDate(row.workDate);
            const attended = attendedKeys.has(`${row.shiftId}|${row.workDate.slice(0, 10)}`);
            const locked = past || attended;
            return (
              <TableRow key={row.id} className={cn(locked && "opacity-60")}>
                <TableCell className="flex items-center gap-2">
                  {new Date(row.workDate).toLocaleDateString("vi-VN")}
                  {attended ? (
                    <Badge variant="secondary">Đã chấm công</Badge>
                  ) : (
                    past && <Badge variant="secondary">Đã qua</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {row.shift.name} ({row.shift.startTime}–{row.shift.endTime})
                </TableCell>
                <TableCell className="flex gap-2">
                  {locked ? (
                    <span className="text-xs text-muted-foreground">
                      {attended ? "Đã chấm công, không thể sửa/gỡ" : "Không thể sửa ngày đã qua"}
                    </span>
                  ) : (
                    <>
                      <Select value={row.shiftId} onValueChange={(v) => handleChangeShift(row.id, v as string)}>
                        <SelectTrigger className="w-40">
                          <SelectValue>
                            {(value: string) => shifts.find((s) => s.id === value)?.name ?? "Đổi ca"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {shifts.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(row.id)}>
                        Gỡ
                      </Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {loading && <p className="text-sm text-muted-foreground">Đang tải...</p>}
      {!loading && schedule.length === 0 && (
        <p className="text-sm text-muted-foreground">Chưa có lịch làm việc tháng này.</p>
      )}

      <div className="space-y-3 rounded-lg border p-4">
        <Label>Xếp lịch mới</Label>
        <Select value={bulkShiftId} onValueChange={(v) => setBulkShiftId(v as string)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Chọn ca">
              {(value: string) => shifts.find((s) => s.id === value)?.name ?? "Chọn ca"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {shifts.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name} ({s.startTime}–{s.endTime})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
            const past = isPastDay(day);
            return (
              <button
                key={day}
                type="button"
                disabled={past}
                onClick={() => toggleDay(day)}
                title={past ? "Ngày đã qua, không thể xếp lịch" : undefined}
                className={cn(
                  "flex size-9 items-center justify-center rounded-md border text-sm transition-colors",
                  past
                    ? "cursor-not-allowed border-border/50 text-muted-foreground/40"
                    : selectedDays.has(day)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:bg-muted",
                )}
              >
                {day}
              </button>
            );
          })}
        </div>

        {bulkError && <p className="text-sm text-destructive">{bulkError}</p>}

        <Button onClick={handleBulkCreate}>Xếp lịch ({selectedDays.size} ngày)</Button>
      </div>
    </div>
  );
}

function AttendanceTab({ employeeId }: { employeeId: string }) {
  const toast = useToast();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [scheduleRows, setScheduleRows] = useState<EmployeeWorkScheduleItem[]>([]);
  const [attendanceRows, setAttendanceRows] = useState<AttendanceItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    const from = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const to = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    const [schedules, attendanceResult] = await Promise.all([
      workScheduleApi.fetchEmployeeWorkSchedule(employeeId, month, year),
      attendanceApi.fetchAttendance({ employeeId, from, to, limit: 100 }),
    ]);
    setScheduleRows(schedules);
    setAttendanceRows(attendanceResult.data);
    setLoading(false);
  }, [employeeId, month, year]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount/thay-doi-thang, refetch tu setState ben trong
    refetch();
  }, [refetch]);

  function findAttendance(shiftId: string, workDate: string) {
    return attendanceRows.find((a) => a.shiftId === shiftId && a.workDate.slice(0, 10) === workDate.slice(0, 10));
  }

  function isFutureDay(workDate: string) {
    const d = new Date(workDate);
    const workDateUTC = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    const todayUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    return workDateUTC > todayUTC;
  }

  async function handleCheckIn(shiftId: string, workDate: string) {
    try {
      await attendanceApi.checkIn({ employeeId, shiftId, workDate: workDate.slice(0, 10) });
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Tháng</p>
          <Input
            type="number"
            min="1"
            max="12"
            className="w-20"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          />
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Năm</p>
          <Input type="number" className="w-24" value={year} onChange={(e) => setYear(Number(e.target.value))} />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ngày</TableHead>
            <TableHead>Ca</TableHead>
            <TableHead>Giờ vào</TableHead>
            <TableHead>Giờ ra</TableHead>
            <TableHead className="w-40" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {scheduleRows.map((row) => {
            const attendance = findAttendance(row.shiftId, row.workDate);
            return (
              <TableRow key={row.id}>
                <TableCell>{new Date(row.workDate).toLocaleDateString("vi-VN")}</TableCell>
                <TableCell>{row.shift.name}</TableCell>
                <TableCell>
                  {attendance?.checkedInAt ? new Date(attendance.checkedInAt).toLocaleTimeString("vi-VN") : "—"}
                </TableCell>
                <TableCell>
                  {attendance?.checkedOutAt ? new Date(attendance.checkedOutAt).toLocaleTimeString("vi-VN") : "—"}
                </TableCell>
                <TableCell>
                  {!attendance && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isFutureDay(row.workDate)}
                      title={isFutureDay(row.workDate) ? "Chưa đến ngày làm việc, chưa thể chấm công" : undefined}
                      onClick={() => handleCheckIn(row.shiftId, row.workDate)}
                    >
                      Chấm công vào
                    </Button>
                  )}
                  {attendance && !attendance.checkedOutAt && (
                    <Button size="sm" variant="outline" onClick={() => handleCheckOut(attendance.id)}>
                      Chấm công ra
                    </Button>
                  )}
                  {attendance?.checkedOutAt && <Badge variant="secondary">Hoàn tất</Badge>}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {loading && <p className="text-sm text-muted-foreground">Đang tải...</p>}
      {!loading && scheduleRows.length === 0 && (
        <p className="text-sm text-muted-foreground">Chưa có lịch làm việc tháng này để chấm công.</p>
      )}
    </div>
  );
}

function PaymentsTab({ employeeId }: { employeeId: string }) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [rows, setRows] = useState<DailyPaymentItem[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalHours, setTotalHours] = useState(0);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    const result = await dailyPaymentApi.fetchEmployeePayments(employeeId, month, year);
    setRows(result.data);
    setTotalAmount(result.totalAmount);
    setTotalHours(result.totalHours);
    setLoading(false);
  }, [employeeId, month, year]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount/thay-doi-thang, refetch tu setState ben trong
    refetch();
  }, [refetch]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Tháng</p>
          <Input
            type="number"
            min="1"
            max="12"
            className="w-20"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          />
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Năm</p>
          <Input type="number" className="w-24" value={year} onChange={(e) => setYear(Number(e.target.value))} />
        </div>
      </div>

      <div className="flex gap-6 rounded-lg border p-4">
        <div>
          <p className="text-xs text-muted-foreground">Tổng giờ làm</p>
          <p className="text-lg font-semibold">{totalHours.toLocaleString("vi-VN")}h</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Tổng lương</p>
          <p className="text-lg font-semibold">{totalAmount.toLocaleString("vi-VN")}đ</p>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ngày</TableHead>
            <TableHead>Vị trí</TableHead>
            <TableHead>Số giờ</TableHead>
            <TableHead>Đơn giá/giờ</TableHead>
            <TableHead>Thành tiền</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{new Date(row.workDate).toLocaleDateString("vi-VN")}</TableCell>
              <TableCell>{row.position.name}</TableCell>
              <TableCell>{row.hoursWorked}</TableCell>
              <TableCell>{Number(row.hourlyRate).toLocaleString("vi-VN")}đ</TableCell>
              <TableCell>{Number(row.amount).toLocaleString("vi-VN")}đ</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {loading && <p className="text-sm text-muted-foreground">Đang tải...</p>}
      {!loading && rows.length === 0 && (
        <p className="text-sm text-muted-foreground">Chưa có dữ liệu lương tháng này.</p>
      )}
    </div>
  );
}

function EmploymentPeriodTab({ employeeId }: { employeeId: string }) {
  const { data, loading } = useEmploymentPeriods(employeeId);

  if (loading) return <p className="text-sm text-muted-foreground">Đang tải...</p>;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Từ ngày</TableHead>
          <TableHead>Đến ngày</TableHead>
          <TableHead>Số ngày</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row) => (
          <TableRow key={row.id}>
            <TableCell>{new Date(row.startDate).toLocaleDateString("vi-VN")}</TableCell>
            <TableCell>{row.endDate ? new Date(row.endDate).toLocaleDateString("vi-VN") : "Đang làm"}</TableCell>
            <TableCell>{row.days}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
