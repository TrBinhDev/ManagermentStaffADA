"use client";

import { useEffect, useState } from "react";
import * as dailyPaymentApi from "@/features/daily-payment/daily-payment.api";
import type { PaymentSummaryEntry } from "@/features/daily-payment/daily-payment.types";
import { Input } from "@/components/ui/input";

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

      <div className="flex flex-wrap items-end gap-2 rounded-xl border border-border/60 bg-card/60 p-3">
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
        <p className="text-xs opacity-80">Tổng lương toàn nhà hàng</p>
        <p className="text-2xl font-bold">{grandTotal.toLocaleString("vi-VN")}đ</p>
      </div>

      {!loading && data.length === 0 && (
        <p className="text-sm text-muted-foreground">Chưa có ai được trả lương trong tháng này.</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {data.map((row) => (
          <div
            key={row.employeeId}
            className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-card/60 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md hover:shadow-primary/10"
          >
            <p className="truncate text-base font-semibold" title={row.fullName}>
              {row.fullName}
            </p>
            <p className="text-xs text-muted-foreground">{row.totalHours.toLocaleString("vi-VN")}h công</p>
            <p className="text-lg font-bold text-primary">{row.totalAmount.toLocaleString("vi-VN")}đ</p>
          </div>
        ))}
      </div>

      {loading && <p className="text-sm text-muted-foreground">Đang tải...</p>}
    </div>
  );
}
