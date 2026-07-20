"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";
import { useAuthStore } from "@/features/auth/auth.store";
import { ROUTES } from "@/constants/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ApiErrorBody } from "@/types/api";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      router.replace(ROUTES.departments);
    } catch (err) {
      const message = isAxiosError<ApiErrorBody>(err)
        ? (err.response?.data?.error?.message ?? "Đăng nhập thất bại")
        : "Đăng nhập thất bại";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-linear-to-br from-[oklch(0.96_0.025_268)] via-background to-[oklch(0.96_0.03_55)] dark:from-[oklch(0.15_0.03_270)] dark:via-background dark:to-[oklch(0.16_0.03_260)]">
      <div className="animate-float-a pointer-events-none absolute -top-32 -left-24 h-80 w-80 rounded-full bg-indigo-400/30 blur-3xl dark:bg-indigo-500/20" />
      <div className="animate-float-b pointer-events-none absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-fuchsia-400/25 blur-3xl dark:bg-fuchsia-500/15" />
      <div className="animate-float-c pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-amber-300/25 blur-3xl dark:bg-amber-500/15" />

      <form
        onSubmit={handleSubmit}
        className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10 w-full max-w-sm space-y-4 rounded-2xl border border-border/60 bg-card/80 p-6 shadow-lg shadow-primary/10 backdrop-blur-xl"
      >
        <h1 className="bg-linear-to-r from-primary to-accent bg-clip-text text-lg font-semibold text-transparent">
          Đăng nhập
        </h1>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Mật khẩu</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </Button>
      </form>
    </div>
  );
}
