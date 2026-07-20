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
    <div className="relative flex min-h-screen flex-1 overflow-hidden bg-linear-to-br from-slate-50 via-white to-slate-100 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      <div className="pointer-events-none absolute -top-32 -left-24 h-80 w-80 rounded-full bg-blue-200/40 blur-3xl dark:bg-blue-500/10" />
      <div className="pointer-events-none absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-purple-200/30 blur-3xl dark:bg-purple-500/10" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-emerald-200/20 blur-3xl dark:bg-emerald-500/10" />

      <Sidebar />

      <main className="relative z-10 min-w-0 flex-1 p-6">
        <div
          key={pathname}
          className="animate-in fade-in slide-in-from-bottom-2 duration-300 min-w-0 rounded-2xl border border-white/60 bg-white/70 p-6 shadow-lg shadow-slate-200/50 backdrop-blur-xl dark:border-white/10 dark:bg-neutral-900/60 dark:shadow-black/20"
        >
          {children}
        </div>
      </main>
    </div>
  );
}
