"use client";

import { useEffect, useMemo, useState } from "react";
import * as workScheduleApi from "@/features/work-schedule/work-schedule.api";
import type { WorkScheduleSummaryItem } from "@/features/work-schedule/work-schedule.types";
import { useShiftStore } from "@/features/shift/shift.store";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const ALL_SHIFTS = "__all_shifts__";
const WEEKDAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export default function WorkSchedulePage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [shiftId, setShiftId] = useState<string | null>(null);
  const [data, setData] = useState<WorkScheduleSummaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

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
  const todayUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  // Chu nhat (getDay()=0) can quy ve cuoi tuan (index 6) de tuan bat dau tu Thu 2.
  const leadingBlanks = (new Date(year, month - 1, 1).getDay() + 6) % 7;

  function isPastDay(day: number) {
    return Date.UTC(year, month - 1, day) < todayUTC;
  }

  function isToday(day: number) {
    return Date.UTC(year, month - 1, day) === todayUTC;
  }

  const byDay = useMemo(() => {
    const map = new Map<number, WorkScheduleSummaryItem[]>();
    for (const item of data) {
      const day = new Date(item.workDate).getUTCDate();
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(item);
    }
    return map;
  }, [data]);

  const cells = useMemo(() => {
    const totalCells = leadingBlanks + daysInMonth;
    const trailingBlanks = (7 - (totalCells % 7)) % 7;
    return [
      ...Array.from({ length: leadingBlanks }, () => null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
      ...Array.from({ length: trailingBlanks }, () => null),
    ];
  }, [leadingBlanks, daysInMonth]);

  const selectedGroups = useMemo(() => {
    if (selectedDay === null) return [];
    const items = byDay.get(selectedDay) ?? [];
    const byShift = new Map<string, { shift: WorkScheduleSummaryItem["shift"]; rows: WorkScheduleSummaryItem[] }>();
    for (const item of items) {
      if (!byShift.has(item.shiftId)) byShift.set(item.shiftId, { shift: item.shift, rows: [] });
      byShift.get(item.shiftId)!.rows.push(item);
    }
    return Array.from(byShift.values())
      .map((group) => ({
        ...group,
        rows: [...group.rows].sort((a, b) => a.employee.fullName.localeCompare(b.employee.fullName)),
      }))
      .sort((a, b) => a.shift.startTime.localeCompare(b.shift.startTime));
  }, [selectedDay, byDay]);

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
            <SelectTrigger className="h-8 w-48">
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

      {!loading && (
        <div className="space-y-2">
          <div className="grid grid-cols-7 gap-2">
            {WEEKDAY_LABELS.map((label) => (
              <div key={label} className="text-center text-xs font-medium text-muted-foreground">
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {cells.map((day, i) => {
              if (day === null) return <div key={`blank-${i}`} />;
              const items = byDay.get(day) ?? [];
              const peopleCount = new Set(items.map((item) => item.employeeId)).size;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={cn(
                    "flex aspect-square flex-col items-start gap-1 rounded-xl border p-2 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
                    isToday(day) ? "border-primary bg-primary/5" : "border-border/60 bg-card/60",
                    isPastDay(day) && "opacity-50",
                  )}
                >
                  <span className={cn("text-sm font-semibold", isToday(day) && "text-primary")}>{day}</span>
                  {peopleCount > 0 && (
                    <Badge variant={isToday(day) ? "default" : "secondary"} className="mt-auto">
                      {peopleCount} người
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <Dialog open={selectedDay !== null} onOpenChange={(open) => !open && setSelectedDay(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Lịch làm việc ngày {selectedDay !== null && `${selectedDay}/${month}/${year}`}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {selectedGroups.length === 0 && (
              <p className="text-sm text-muted-foreground">Chưa có ai được xếp lịch ngày này.</p>
            )}

            {selectedGroups.map(({ shift, rows }) => (
              <div key={shift.id} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <h3 className="w-24 shrink-0 truncate text-sm font-semibold">{shift.name}</h3>
                  <Badge variant="secondary" className="shrink-0">
                    {shift.startTime}–{shift.endTime}
                  </Badge>
                </div>
                <ul className="space-y-1 text-sm">
                  {rows.map((row) => (
                    <li key={row.id} className="flex gap-1 text-muted-foreground">
                      <span className="w-16 shrink-0 tabular-nums">{row.employee.code}</span>
                      <span>— {row.employee.fullName}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
