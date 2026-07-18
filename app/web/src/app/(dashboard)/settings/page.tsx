"use client";

import { useState, type FormEvent } from "react";
import { isAxiosError } from "axios";
import { useAuthStore } from "@/features/auth/auth.store";
import * as authApi from "@/features/auth/auth.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ApiErrorBody } from "@/types/api";

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setLoading(true);
    try {
      await authApi.changePassword({ oldPassword, newPassword });
      setMessage("Đổi mật khẩu thành công");
      setOldPassword("");
      setNewPassword("");
    } catch (err) {
      const msg = isAxiosError<ApiErrorBody>(err)
        ? (err.response?.data?.error?.message ?? "Đổi mật khẩu thất bại")
        : "Đổi mật khẩu thất bại";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Cài đặt</h1>
        {user && (
          <p className="mt-1 text-sm text-muted-foreground">
            {user.email} — {user.role}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border p-4">
        <h2 className="text-sm font-medium">Đổi mật khẩu</h2>

        <div className="space-y-2">
          <Label htmlFor="oldPassword">Mật khẩu cũ</Label>
          <Input
            id="oldPassword"
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="newPassword">Mật khẩu mới</Label>
          <Input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>

        {message && <p className="text-sm text-emerald-600">{message}</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={loading}>
          {loading ? "Đang lưu..." : "Đổi mật khẩu"}
        </Button>
      </form>
    </div>
  );
}
