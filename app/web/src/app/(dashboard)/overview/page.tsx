"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Wallet, Users, CalendarDays, Clock } from "lucide-react";
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
      setPayments([...paymentsResult.data].sort((a, b) => b.totalAmount - a.totalAmount));
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [today, month, year]);

  const topPayments = payments.slice(0, 6);

  const tiles = [
    {
      label: "Tổng lương tháng này",
      value: `${stats.grandTotal.toLocaleString("vi-VN")}đ`,
      icon: Wallet,
      sub: `Tháng ${month}/${year}`,
    },
    {
      label: "Nhân viên đang làm",
      value: stats.activeEmployees.toLocaleString("vi-VN"),
      icon: Users,
      sub: `${stats.resignedEmployees} đã nghỉ việc`,
    },
    {
      label: "Có lịch hôm nay",
      value: stats.scheduledToday.toLocaleString("vi-VN"),
      icon: CalendarDays,
      sub: "Theo lịch làm việc",
    },
    {
      label: "Đã chấm công hôm nay",
      value: stats.checkedInToday.toLocaleString("vi-VN"),
      icon: Clock,
      sub: `Trên ${stats.scheduledToday} lịch hôm nay`,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tổng quan</h1>
        <p className="text-sm text-muted-foreground">
          {stats.departments} phòng ban · {stats.positions} vị trí đang dùng · {stats.shifts} ca đang hoạt động
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <div key={tile.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">{tile.label}</p>
                <Icon className="size-4 text-muted-foreground" />
              </div>
              <p className="mt-2 text-2xl font-bold">{tile.value}</p>
              <p className="text-xs text-muted-foreground">{tile.sub}</p>
            </div>
          );
        })}
      </div>

      {loading && <p className="text-sm text-muted-foreground">Đang tải...</p>}

      {!loading && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm xl:col-span-2">
            <p className="mb-4 text-sm font-semibold">Top lương tháng này</p>
            {topPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có dữ liệu lương tháng này.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={topPayments} margin={{ left: 0, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="fullName"
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                    axisLine={{ stroke: "var(--border)" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--muted)" }}
                    contentStyle={CHART_TOOLTIP_STYLE}
                    formatter={(value) => [`${Number(value).toLocaleString("vi-VN")}đ`, "Lương"]}
                  />
                  <Bar dataKey="totalAmount" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-sm font-semibold">Lương cao nhất</p>
            <p className="mb-4 text-xs text-muted-foreground">Top {topPayments.length} nhân viên tháng này</p>
            {topPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có dữ liệu.</p>
            ) : (
              <div className="space-y-4">
                {topPayments.map((row) => (
                  <div key={row.employeeId} className="flex items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium text-secondary-foreground">
                      {row.fullName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{row.fullName}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {row.totalHours.toLocaleString("vi-VN")}h công
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-medium">{row.totalAmount.toLocaleString("vi-VN")}đ</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {!loading && payments.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
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
