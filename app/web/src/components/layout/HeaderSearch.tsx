"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import * as employeeApi from "@/features/employee/employee.api";
import type { Employee } from "@/features/employee/employee.types";
import { Input } from "@/components/ui/input";

const DEBOUNCE_MS = 300;

export function HeaderSearch() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Employee[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- xoa ket qua cu khi o tim kien rong, khong phai fetch
      setResults([]);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      const result = await employeeApi.fetchEmployees({ search: trimmed, limit: 6 });
      setResults(result.data);
      setLoading(false);
      setOpen(true);
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function goToEmployee(id: string) {
    router.push(`/employees/${id}`);
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Tìm nhân viên theo mã/tên..."
        className="pl-8"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query.trim() && setOpen(true)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
      />

      {open && query.trim() && (
        <div className="absolute top-full left-0 z-20 mt-1 w-full rounded-lg border border-border bg-popover p-1 shadow-md">
          {loading && <p className="px-2 py-1.5 text-sm text-muted-foreground">Đang tìm...</p>}
          {!loading && results.length === 0 && (
            <p className="px-2 py-1.5 text-sm text-muted-foreground">Không tìm thấy nhân viên nào.</p>
          )}
          {!loading &&
            results.map((emp) => (
              <button
                key={emp.id}
                onClick={() => goToEmployee(emp.id)}
                className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
              >
                <span className="truncate">{emp.fullName}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{emp.code}</span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
