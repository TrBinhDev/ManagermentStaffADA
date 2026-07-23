"use client";

import { useCallback, useEffect, useState } from "react";
import * as meApi from "@/features/me/me.api";
import type { DailyPaymentItem } from "@/features/daily-payment/daily-payment.types";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function MyPaymentsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [rows, setRows] = useState<DailyPaymentItem[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalHours, setTotalHours] = useState(0);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    const result = await meApi.fetchMyPayments(month, year);
    setRows(result.data);
    setTotalAmount(result.totalAmount);
    setTotalHours(result.totalHours);
    setLoading(false);
  }, [month, year]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount/thay-doi-thang, refetch tu setState ben trong
    refetch();
  }, [refetch]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Lương của tôi</h1>

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

      <div className="rounded-2xl bg-linear-to-br from-primary to-accent p-5 text-primary-foreground shadow-md shadow-primary/25">
        <div className="flex gap-8">
          <div>
            <p className="text-xs opacity-80">Tổng giờ làm</p>
            <p className="text-2xl font-bold">{totalHours.toLocaleString("vi-VN")}h</p>
          </div>
          <div>
            <p className="text-xs opacity-80">Tổng lương</p>
            <p className="text-2xl font-bold">{totalAmount.toLocaleString("vi-VN")}đ</p>
          </div>
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
