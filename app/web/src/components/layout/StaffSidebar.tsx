"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Clock, Wallet, User, LogOut, ChevronsUpDown } from "lucide-react";
import { useAuthStore } from "@/features/auth/auth.store";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: ROUTES.myWorkSchedule, label: "Lịch làm của tôi", icon: CalendarDays },
  { href: ROUTES.myAttendance, label: "Chấm công của tôi", icon: Clock },
  { href: ROUTES.myPayments, label: "Lương của tôi", icon: Wallet },
  { href: ROUTES.myProfile, label: "Hồ sơ của tôi", icon: User },
];

export function StaffSidebar({ open = true }: { open?: boolean }) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : "??";

  return (
    <aside
      className={cn(
        "relative z-10 flex shrink-0 flex-col overflow-hidden bg-transparent transition-[width] duration-200",
        open ? "w-64" : "w-0",
      )}
    >
      <div className="flex h-full w-64 flex-col">
        <div className="flex items-center gap-2 px-4 py-3.5">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-sidebar-foreground">Management Staff ADA</p>
            <p className="truncate text-xs text-muted-foreground">Nhân viên</p>
          </div>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  active && "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={() => logout()}
          className="mx-2 mb-2 flex items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-sidebar-accent"
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium text-secondary-foreground">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-sidebar-foreground">STAFF</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email ?? ""}</p>
          </div>
          <LogOut className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </div>
    </aside>
  );
}
