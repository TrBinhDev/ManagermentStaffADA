"use client";

import { useEffect, useState } from "react";
import * as dailyPaymentApi from "@/features/daily-payment/daily-payment.api";
import type { PaymentSummaryEntry } from "@/features/daily-payment/daily-payment.types";
import { Input } from "@/components/ui/input";

// Hook dem so tang dan tu 0 -> target, dung requestAnimationFrame, easeOutCubic cho muot.
function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const from = 0;

    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

function AnimatedNumber({
  target,
  format,
  className,
}: {
  target: number;
  format: (v: number) => string;
  className?: string;
}) {
  const value = useCountUp(target);
  return <p className={className}>{format(value)}</p>;
}

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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Lương</h1>

      <div className="flex flex-wrap items-end gap-2 rounded-xl border border-border bg-card p-3">
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

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <p className="text-sm font-medium text-muted-foreground">
          Tổng lương toàn nhà hàng
        </p>
        <AnimatedNumber
          target={grandTotal}
          format={(v) => `${v.toLocaleString("vi-VN")}đ`}
          className="mt-2 text-2xl font-bold"
        />
      </div>

      {!loading && data.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Chưa có ai được trả lương trong tháng này.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {data.map((row) => (
          <div
            key={row.employeeId}
            className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <p
              className="truncate text-base font-semibold"
              title={row.fullName}
            >
              {row.fullName}
            </p>
            <AnimatedNumber
              target={row.totalHours}
              format={(v) => `${v.toLocaleString("vi-VN")}h công`}
              className="text-xs text-muted-foreground"
            />
            <AnimatedNumber
              target={row.totalAmount}
              format={(v) => `${v.toLocaleString("vi-VN")}đ`}
              className="text-lg font-bold text-primary"
            />
          </div>
        ))}
      </div>

      {loading && <p className="text-sm text-muted-foreground">Đang tải...</p>}
    </div>
  );
}
