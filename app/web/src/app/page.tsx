"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/features/auth/auth.store";
import { ROUTES } from "@/constants/routes";

export default function HomePage() {
  const router = useRouter();
  const isBootstrapping = useAuthStore((s) => s.isBootstrapping);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (isBootstrapping) return;
    router.replace(isAuthenticated ? ROUTES.overview : ROUTES.login);
  }, [isBootstrapping, isAuthenticated, router]);

  return null;
}
