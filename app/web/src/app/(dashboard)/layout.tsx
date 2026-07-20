"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/features/auth/auth.store";
import { Sidebar } from "@/components/layout/Sidebar";
import { ROUTES } from "@/constants/routes";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isBootstrapping = useAuthStore((s) => s.isBootstrapping);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isBootstrapping && !isAuthenticated) {
      router.replace(ROUTES.login);
    }
  }, [isBootstrapping, isAuthenticated, router]);

  if (isBootstrapping) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Đang tải...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="relative flex min-h-screen flex-1 overflow-hidden bg-linear-to-br from-[oklch(0.96_0.025_268)] via-background to-[oklch(0.96_0.03_55)] dark:from-[oklch(0.15_0.03_270)] dark:via-background dark:to-[oklch(0.16_0.03_260)]">
      <div className="animate-float-a pointer-events-none absolute -top-32 -left-24 h-80 w-80 rounded-full bg-indigo-400/30 blur-3xl dark:bg-indigo-500/20" />
      <div className="animate-float-b pointer-events-none absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-fuchsia-400/25 blur-3xl dark:bg-fuchsia-500/15" />
      <div className="animate-float-c pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-amber-300/25 blur-3xl dark:bg-amber-500/15" />

      <Sidebar />

      <main className="relative z-10 min-w-0 flex-1 p-6">
        <div
          key={pathname}
          className="animate-in fade-in slide-in-from-bottom-2 duration-300 min-w-0 rounded-2xl border border-border/60 bg-card/80 p-6 shadow-lg shadow-primary/5 backdrop-blur-xl dark:shadow-black/20"
        >
          {children}
        </div>
      </main>
    </div>
  );
}
