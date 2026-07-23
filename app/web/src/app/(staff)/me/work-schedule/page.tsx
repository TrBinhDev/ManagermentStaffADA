"use client";

import { useCallback, useEffect, useState } from "react";
import * as meApi from "@/features/me/me.api";
import type { EmployeeWorkScheduleItem } from "@/features/work-schedule/work-schedule.types";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function MyWorkSchedulePage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [rows, setRows] = useState<EmployeeWorkScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    const result = await meApi.fetchMyWorkSchedule(month, year);
    setRows(result);
    setLoading(false);
  }, [month, year]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount/thay-doi-thang, refetch tu setState ben trong
    refetch();
  }, [refetch]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Lịch làm của tôi</h1>

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
            <TableHead>Giờ ca</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{new Date(row.workDate).toLocaleDateString("vi-VN")}</TableCell>
              <TableCell>{row.shift.name}</TableCell>
              <TableCell className="tabular-nums">
                {row.shift.startTime}–{row.shift.endTime}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {loading && <p className="text-sm text-muted-foreground">Đang tải...</p>}
      {!loading && rows.length === 0 && (
        <p className="text-sm text-muted-foreground">Chưa có lịch làm việc tháng này.</p>
      )}
    </div>
  );
}
