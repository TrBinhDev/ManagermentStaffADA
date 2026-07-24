"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { PanelLeft, Search, Settings } from "lucide-react";
import { useAuthStore } from "@/features/auth/auth.store";
import { Sidebar } from "@/components/layout/Sidebar";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { ROUTES } from "@/constants/routes";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isBootstrapping = useAuthStore((s) => s.isBootstrapping);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.role);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (isBootstrapping) return;
    if (!isAuthenticated) {
      router.replace(ROUTES.login);
    } else if (role === "STAFF") {
      router.replace(ROUTES.myWorkSchedule);
    }
  }, [isBootstrapping, isAuthenticated, role, router]);

  if (isBootstrapping) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Đang tải...</div>;
  }

  if (!isAuthenticated || role === "STAFF") {
    return null;
  }

  return (
    <div className="flex h-screen gap-3 overflow-hidden bg-muted/40 p-3">
      <Sidebar open={sidebarOpen} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-background shadow-sm">
        <header className="flex h-14 shrink-0 items-center justify-between gap-4 px-6">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label={sidebarOpen ? "Ẩn thanh điều hướng" : "Hiện thanh điều hướng"}
              onClick={() => setSidebarOpen((v) => !v)}
            >
              <PanelLeft className="size-4" />
            </Button>
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Tìm kiếm..." className="pl-8" />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <ThemeToggle />
            <Link href={ROUTES.settings}>
              <Button variant="ghost" size="icon" aria-label="Cài đặt">
                <Settings className="size-4" />
              </Button>
            </Link>
          </div>
        </header>

        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto p-6">
          <div key={pathname} className="animate-in fade-in duration-300 min-w-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
