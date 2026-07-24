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
      // STAFF khong co quyen vao dashboard admin - dua thang vao khu vuc rieng cua ho.
      const role = useAuthStore.getState().role;
      router.replace(role === "STAFF" ? ROUTES.myWorkSchedule : ROUTES.overview);
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
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-lg font-semibold">Đăng nhập vào Management Staff ADA</h1>
          <p className="text-sm text-muted-foreground">Nhập email và mật khẩu để tiếp tục</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
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
    </div>
  );
}
