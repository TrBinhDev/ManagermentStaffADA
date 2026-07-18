"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/features/auth/auth.store";
import { ToastProvider } from "@/components/toast/toast-context";
import { ConfirmProvider } from "@/components/confirm/confirm-context";

function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const bootstrap = useAuthStore((s) => s.bootstrap);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  return <>{children}</>;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <AuthBootstrap>{children}</AuthBootstrap>
      </ConfirmProvider>
    </ToastProvider>
  );
}
