"use client";

import { useEffect, useMemo, useState } from "react";
import * as workScheduleApi from "@/features/work-schedule/work-schedule.api";
import type { WorkScheduleSummaryItem } from "@/features/work-schedule/work-schedule.types";
import { useShiftStore } from "@/features/shift/shift.store";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const ALL_SHIFTS = "__all_shifts__";

export default function WorkSchedulePage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [shiftId, setShiftId] = useState<string | null>(null);
  const [data, setData] = useState<WorkScheduleSummaryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const shifts = useShiftStore((s) => s.data);
  const fetchShifts = useShiftStore((s) => s.fetchAll);

  useEffect(() => {
    fetchShifts({ limit: 100 });
  }, [fetchShifts]);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount/thay-doi-filter, refetch tu setState ben trong
    setLoading(true);
    workScheduleApi.fetchAllWorkSchedule(month, year, shiftId ?? undefined).then((result) => {
      if (cancelled) return;
      setData(result);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [month, year, shiftId]);

  const daysInMonth = new Date(year, month, 0).getDate();

  const rows = useMemo(() => {
    const byEmployee = new Map<
      string,
      { employee: WorkScheduleSummaryItem["employee"]; days: Map<number, WorkScheduleSummaryItem[]> }
    >();

    for (const item of data) {
      const day = new Date(item.workDate).getUTCDate();
      if (!byEmployee.has(item.employeeId)) {
        byEmployee.set(item.employeeId, { employee: item.employee, days: new Map() });
      }
      const entry = byEmployee.get(item.employeeId)!;
      if (!entry.days.has(day)) entry.days.set(day, []);
      entry.days.get(day)!.push(item);
    }

    return Array.from(byEmployee.values()).sort((a, b) => a.employee.fullName.localeCompare(b.employee.fullName));
  }, [data]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Lịch làm việc</h1>

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
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Ca</p>
          <Select
            value={shiftId ?? ALL_SHIFTS}
            onValueChange={(v) => setShiftId(v === ALL_SHIFTS ? null : (v as string))}
          >
            <SelectTrigger className="w-48">
              <SelectValue>
                {(value: string) =>
                  value === ALL_SHIFTS ? "Tất cả ca" : (shifts.find((s) => s.id === value)?.name ?? "Tất cả ca")
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_SHIFTS}>Tất cả ca</SelectItem>
              {shifts.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Đang tải...</p>}
      {!loading && rows.length === 0 && (
        <p className="text-sm text-muted-foreground">Chưa có ai được xếp lịch trong tháng này.</p>
      )}

      {!loading && rows.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 bg-background">Nhân viên</TableHead>
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
                <TableHead key={day} className="text-center">
                  {day}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ employee, days }) => (
              <TableRow key={employee.id}>
                <TableCell className="sticky left-0 whitespace-nowrap bg-background">
                  {employee.code} — {employee.fullName}
                </TableCell>
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                  const items = days.get(day);
                  return (
                    <TableCell key={day} className="text-center text-xs">
                      {items?.map((item) => item.shift.name).join(", ") ?? ""}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
