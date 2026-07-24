"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Briefcase,
  Users,
  ShieldCheck,
  Settings,
  LogOut,
  Clock,
  CalendarDays,
  Wallet,
  ChevronsUpDown,
} from "lucide-react";
import { useAuthStore } from "@/features/auth/auth.store";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  ownerOnly?: boolean;
}

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Tổng quan",
    items: [{ href: ROUTES.overview, label: "Tổng quan", icon: LayoutDashboard }],
  },
  {
    label: "Vận hành",
    items: [
      { href: ROUTES.departments, label: "Phòng ban", icon: Building2 },
      { href: ROUTES.positions, label: "Vị trí", icon: Briefcase },
      { href: ROUTES.shifts, label: "Ca làm việc", icon: Clock },
      { href: ROUTES.workSchedule, label: "Lịch làm việc", icon: CalendarDays },
      { href: ROUTES.attendance, label: "Chấm công", icon: Clock },
      { href: ROUTES.payments, label: "Lương", icon: Wallet },
      { href: ROUTES.employees, label: "Nhân viên", icon: Users },
    ],
  },
  {
    label: "Quản trị",
    items: [
      { href: ROUTES.managerAccounts, label: "Tài khoản quản lý", icon: ShieldCheck, ownerOnly: true },
      { href: ROUTES.settings, label: "Cài đặt", icon: Settings },
    ],
  },
];

export function Sidebar({ open = true }: { open?: boolean }) {
  const pathname = usePathname();
  const role = useAuthStore((s) => s.role);
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
      {/* wrapper co w-64 co dinh - giu nguyen kich thuoc noi dung khi aside ben ngoai dang animate
          width ve 0, tranh chu/icon bi bop meo trong luc chuyen dong */}
      <div className="flex h-full w-64 flex-col">
        <div className="flex items-center gap-2 px-4 py-3.5">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-sidebar-foreground">Management Staff ADA</p>
            <p className="truncate text-xs text-muted-foreground">Quản lý nhân viên</p>
          </div>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {NAV_GROUPS.map((group) => {
            const items = group.items.filter((item) => !item.ownerOnly || role === "OWNER");
            if (items.length === 0) return null;
            return (
              <div key={group.label} className="space-y-1">
                <p className="px-2 text-xs font-medium text-muted-foreground">{group.label}</p>
                {items.map((item) => {
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
              </div>
            );
          })}
        </nav>

        <button
          onClick={() => logout()}
          className="flex items-center gap-2.5 rounded-md px-2 py-1.5 mx-2 mb-2 text-left transition-colors hover:bg-sidebar-accent"
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium text-secondary-foreground">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-sidebar-foreground">{role ?? "—"}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email ?? ""}</p>
          </div>
          <LogOut className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </div>
    </aside>
  );
}
