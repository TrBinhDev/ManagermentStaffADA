"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Briefcase,
  Users,
  ShieldCheck,
  Settings,
  LogOut,
  Clock,
  CalendarDays,
  Wallet,
} from "lucide-react";
import { useAuthStore } from "@/features/auth/auth.store";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: ROUTES.departments, label: "Phòng ban", icon: Building2 },
  { href: ROUTES.positions, label: "Vị trí", icon: Briefcase },
  { href: ROUTES.shifts, label: "Ca làm việc", icon: Clock },
  { href: ROUTES.workSchedule, label: "Lịch làm việc", icon: CalendarDays },
  { href: ROUTES.attendance, label: "Chấm công", icon: Clock },
  { href: ROUTES.payments, label: "Lương", icon: Wallet },
  { href: ROUTES.employees, label: "Nhân viên", icon: Users },
  {
    href: ROUTES.managerAccounts,
    label: "Tài khoản quản lý",
    icon: ShieldCheck,
    ownerOnly: true,
  },
  { href: ROUTES.settings, label: "Cài đặt", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const role = useAuthStore((s) => s.role);
  const logout = useAuthStore((s) => s.logout);

  return (
    <aside className="relative z-10 flex w-60 shrink-0 flex-col gap-1 border-r border-sidebar-border bg-sidebar/80 p-4 backdrop-blur-xl">
      <div className="mb-4 px-2 py-1">
        <h1 className="text-lg font-extrabold tracking-tight">
          <span className="text-foreground">Management</span>{" "}
          <span className="bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">
            Staff ADA
          </span>
        </h1>
      </div>

      {NAV_ITEMS.filter((item) => !item.ownerOnly || role === "OWNER").map(
        (item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                active &&
                  "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
              )}
            >
              <span
                className={cn(
                  "absolute top-1/2 left-0 h-0 w-0.5 -translate-y-1/2 rounded-full bg-linear-to-b from-primary to-accent transition-all duration-200",
                  active && "h-5",
                )}
              />
              <Icon className="size-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
              {item.label}
            </Link>
          );
        },
      )}

      <button
        onClick={() => logout()}
        className="mt-auto flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-destructive transition-colors duration-200 hover:bg-destructive/10"
      >
        <LogOut className="size-4 shrink-0" />
        Đăng xuất
      </button>
    </aside>
  );
}
