"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { PanelLeft } from "lucide-react";
import { useAuthStore } from "@/features/auth/auth.store";
import { StaffSidebar } from "@/components/layout/StaffSidebar";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { ROUTES } from "@/constants/routes";
import { Button } from "@/components/ui/button";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
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
    } else if (role !== "STAFF") {
      // Khu vuc nay chi danh cho STAFF - OWNER/MANAGER vao nham thi dua ve dashboard admin.
      router.replace(ROUTES.overview);
    }
  }, [isBootstrapping, isAuthenticated, role, router]);

  if (isBootstrapping) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Đang tải...</div>;
  }

  if (!isAuthenticated || role !== "STAFF") {
    return null;
  }

  return (
    <div className="flex h-screen gap-3 overflow-hidden bg-muted/40 p-3">
      <StaffSidebar open={sidebarOpen} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-background shadow-sm">
        <header className="flex h-14 shrink-0 items-center justify-between gap-4 px-6">
          <Button
            variant="ghost"
            size="icon"
            aria-label={sidebarOpen ? "Ẩn thanh điều hướng" : "Hiện thanh điều hướng"}
            onClick={() => setSidebarOpen((v) => !v)}
          >
            <PanelLeft className="size-4" />
          </Button>
          <ThemeToggle />
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
