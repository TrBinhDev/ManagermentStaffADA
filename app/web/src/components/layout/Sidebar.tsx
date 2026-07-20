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
  UtensilsCrossed,
  Clock,
  CalendarDays,
} from "lucide-react";
import { useAuthStore } from "@/features/auth/auth.store";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: ROUTES.departments, label: "Phòng ban", icon: Building2 },
  { href: ROUTES.positions, label: "Vị trí", icon: Briefcase },
  { href: ROUTES.shifts, label: "Ca làm việc", icon: Clock },
  { href: ROUTES.workSchedule, label: "Lịch làm việc", icon: CalendarDays },
  { href: ROUTES.employees, label: "Nhân viên", icon: Users },
  { href: ROUTES.managerAccounts, label: "Tài khoản quản lý", icon: ShieldCheck, ownerOnly: true },
  { href: ROUTES.settings, label: "Cài đặt", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const role = useAuthStore((s) => s.role);
  const logout = useAuthStore((s) => s.logout);

  return (
    <aside className="relative z-10 flex w-60 flex-col gap-1 border-r border-white/60 bg-white/70 p-4 backdrop-blur-xl dark:border-white/10 dark:bg-neutral-900/60">
      <div className="mb-4 flex items-center gap-2 px-2 py-1">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <UtensilsCrossed className="size-4" />
        </div>
        <span className="text-sm font-semibold tracking-tight">ManagementStaffADA</span>
      </div>

      {NAV_ITEMS.filter((item) => !item.ownerOnly || role === "OWNER").map((item) => {
        const active = pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground",
              active && "bg-muted font-medium text-foreground",
            )}
          >
            <span
              className={cn(
                "absolute top-1/2 left-0 h-0 w-0.5 -translate-y-1/2 rounded-full bg-primary transition-all duration-200",
                active && "h-5",
              )}
            />
            <Icon className="size-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
            {item.label}
          </Link>
        );
      })}

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
