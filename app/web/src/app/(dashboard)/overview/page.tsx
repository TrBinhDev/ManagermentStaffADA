"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import * as employeeApi from "@/features/employee/employee.api";
import * as departmentApi from "@/features/department/department.api";
import * as positionApi from "@/features/position/position.api";
import * as shiftApi from "@/features/shift/shift.api";
import * as workScheduleApi from "@/features/work-schedule/work-schedule.api";
import * as attendanceApi from "@/features/attendance/attendance.api";
import * as dailyPaymentApi from "@/features/daily-payment/daily-payment.api";
import type { PaymentSummaryEntry } from "@/features/daily-payment/daily-payment.types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function toDateOnly(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface Stats {
  activeEmployees: number;
  resignedEmployees: number;
  departments: number;
  positions: number;
  shifts: number;
  scheduledToday: number;
  checkedInToday: number;
  grandTotal: number;
}

const EMPTY_STATS: Stats = {
  activeEmployees: 0,
  resignedEmployees: 0,
  departments: 0,
  positions: 0,
  shifts: 0,
  scheduledToday: 0,
  checkedInToday: 0,
  grandTotal: 0,
};

const CHART_TOOLTIP_STYLE = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--popover-foreground)",
  fontSize: 12,
};

export default function OverviewPage() {
  const [today] = useState(() => toDateOnly(new Date()));
  const [month] = useState(() => new Date().getMonth() + 1);
  const [year] = useState(() => new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [byDepartment, setByDepartment] = useState<{ name: string; count: number }[]>([]);
  const [payments, setPayments] = useState<PaymentSummaryEntry[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const [activeEmp, resignedEmp, depts, positions, shifts, schedule, attendance, paymentsResult] =
        await Promise.all([
          employeeApi.fetchEmployees({ status: "ACTIVE", limit: 100 }),
          employeeApi.fetchEmployees({ status: "RESIGNED", limit: 1 }),
          departmentApi.fetchDepartments({ limit: 100 }),
          positionApi.fetchPositions({ isActive: true, limit: 100 }),
          shiftApi.fetchShifts({ isActive: true, limit: 1 }),
          workScheduleApi.fetchAllWorkSchedule(month, year),
          attendanceApi.fetchAttendance({ from: today, to: today, limit: 100 }),
          dailyPaymentApi.fetchAllPayments(month, year),
        ]);
      if (cancelled) return;

      const scheduledTodayIds = new Set(
        schedule.filter((row) => row.workDate.slice(0, 10) === today).map((row) => row.employeeId),
      );
      const checkedInToday = attendance.data.filter((row) => row.checkedInAt).length;

      const positionDeptMap = new Map(positions.data.map((p) => [p.id, p.department.name]));
      const deptCount = new Map<string, number>();
      for (const emp of activeEmp.data) {
        const deptName = positionDeptMap.get(emp.positionId) ?? "Khác";
        deptCount.set(deptName, (deptCount.get(deptName) ?? 0) + 1);
      }

      setStats({
        activeEmployees: activeEmp.total,
        resignedEmployees: resignedEmp.total,
        departments: depts.total,
        positions: positions.total,
        shifts: shifts.total,
        scheduledToday: scheduledTodayIds.size,
        checkedInToday,
        grandTotal: paymentsResult.grandTotal,
      });
      setByDepartment(Array.from(deptCount.entries()).map(([name, count]) => ({ name, count })));
      setPayments([...paymentsResult.data].sort((a, b) => b.totalAmount - a.totalAmount));
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [today, month, year]);

  const topPayments = payments.slice(0, 8);

  const tiles: { label: string; value: string }[] = [
    { label: "Nhân viên đang làm", value: stats.activeEmployees.toLocaleString("vi-VN") },
    { label: "Đã nghỉ việc", value: stats.resignedEmployees.toLocaleString("vi-VN") },
    { label: "Phòng ban", value: stats.departments.toLocaleString("vi-VN") },
    { label: "Vị trí đang dùng", value: stats.positions.toLocaleString("vi-VN") },
    { label: "Ca đang hoạt động", value: stats.shifts.toLocaleString("vi-VN") },
    { label: "Có lịch hôm nay", value: stats.scheduledToday.toLocaleString("vi-VN") },
    { label: "Đã chấm công hôm nay", value: stats.checkedInToday.toLocaleString("vi-VN") },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Tổng quan</h1>

      <div className="rounded-2xl bg-linear-to-br from-primary to-accent p-5 text-primary-foreground shadow-md shadow-primary/25">
        <p className="text-xs opacity-80">Tổng lương toàn nhà hàng tháng này</p>
        <p className="text-2xl font-bold">{stats.grandTotal.toLocaleString("vi-VN")}đ</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-2xl border border-border/60 bg-card/60 p-4">
            <p className="text-xs text-muted-foreground">{tile.label}</p>
            <p className="text-2xl font-bold">{tile.value}</p>
          </div>
        ))}
      </div>

      {loading && <p className="text-sm text-muted-foreground">Đang tải...</p>}

      {!loading && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
            <p className="mb-2 text-sm font-semibold">Top lương tháng này</p>
            {topPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có dữ liệu lương tháng này.</p>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(200, topPayments.length * 36)}>
                <BarChart data={topPayments} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                    axisLine={{ stroke: "var(--border)" }}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="fullName"
                    width={110}
                    tick={{ fill: "var(--foreground)", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--muted)" }}
                    contentStyle={CHART_TOOLTIP_STYLE}
                    formatter={(value) => [`${Number(value).toLocaleString("vi-VN")}đ`, "Lương"]}
                  />
                  <Bar dataKey="totalAmount" fill="var(--primary)" radius={[0, 4, 4, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
            <p className="mb-2 text-sm font-semibold">Nhân viên đang làm theo phòng ban</p>
            {byDepartment.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có dữ liệu.</p>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(200, byDepartment.length * 36)}>
                <BarChart data={byDepartment} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                    axisLine={{ stroke: "var(--border)" }}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={110}
                    tick={{ fill: "var(--foreground)", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--muted)" }}
                    contentStyle={CHART_TOOLTIP_STYLE}
                    formatter={(value) => [`${value} người`, "Số lượng"]}
                  />
                  <Bar dataKey="count" fill="var(--accent)" radius={[0, 4, 4, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {!loading && payments.length > 0 && (
        <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
          <p className="mb-2 text-sm font-semibold">Bảng lương tháng này (đầy đủ)</p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Nhân viên</TableHead>
                <TableHead>Tổng giờ làm</TableHead>
                <TableHead>Tổng lương</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((row, i) => (
                <TableRow key={row.employeeId}>
                  <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                  <TableCell>{row.fullName}</TableCell>
                  <TableCell>{row.totalHours.toLocaleString("vi-VN")}h</TableCell>
                  <TableCell className="font-medium">{row.totalAmount.toLocaleString("vi-VN")}đ</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
