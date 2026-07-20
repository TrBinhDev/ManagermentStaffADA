"use client";

import { useEffect, useState } from "react";
import * as dailyPaymentApi from "@/features/daily-payment/daily-payment.api";
import type { PaymentSummaryEntry } from "@/features/daily-payment/daily-payment.types";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function PaymentsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState<PaymentSummaryEntry[]>([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount/thay-doi-filter, refetch tu setState ben trong
    setLoading(true);
    dailyPaymentApi.fetchAllPayments(month, year).then((result) => {
      if (cancelled) return;
      setData(result.data);
      setGrandTotal(result.grandTotal);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [month, year]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Lương</h1>

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

      <div className="rounded-lg border p-4">
        <p className="text-xs text-muted-foreground">Tổng lương toàn nhà hàng</p>
        <p className="text-lg font-semibold">{grandTotal.toLocaleString("vi-VN")}đ</p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nhân viên</TableHead>
            <TableHead>Tổng giờ làm</TableHead>
            <TableHead>Tổng lương</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.employeeId}>
              <TableCell>{row.fullName}</TableCell>
              <TableCell>{row.totalHours.toLocaleString("vi-VN")}h</TableCell>
              <TableCell>{row.totalAmount.toLocaleString("vi-VN")}đ</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {loading && <p className="text-sm text-muted-foreground">Đang tải...</p>}
      {!loading && data.length === 0 && (
        <p className="text-sm text-muted-foreground">Chưa có ai được trả lương trong tháng này.</p>
      )}
    </div>
  );
}
