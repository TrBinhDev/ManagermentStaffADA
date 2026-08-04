"use client";

import { useCallback, useEffect, useState } from "react";
import * as meApi from "@/features/me/me.api";
import type { MeUpdateProfileInput } from "@/features/me/me.types";
import { useAuthStore } from "@/features/auth/auth.store";
import { useToast } from "@/components/toast/toast-context";
import { getErrorMessage } from "@/lib/error";
import { AvatarUploader } from "@/components/avatar/avatar-uploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const FIELDS: Array<{ key: keyof MeUpdateProfileInput; label: string }> = [
  { key: "gender", label: "Giới tính" },
  { key: "ethnicity", label: "Dân tộc" },
  { key: "religion", label: "Tôn giáo" },
  { key: "permanentAddress", label: "Địa chỉ thường trú" },
  { key: "currentAddress", label: "Địa chỉ hiện tại" },
  { key: "primaryPhone", label: "Số điện thoại" },
  { key: "email", label: "Email liên hệ" },
  { key: "emergencyContactName", label: "Người liên hệ khẩn cấp" },
  { key: "emergencyContactPhone", label: "SĐT liên hệ khẩn cấp" },
  { key: "emergencyContactRelation", label: "Quan hệ" },
  { key: "maritalStatus", label: "Tình trạng hôn nhân" },
  { key: "educationLevel", label: "Trình độ học vấn" },
  { key: "bankName", label: "Ngân hàng" },
  { key: "bankAccountNumber", label: "Số tài khoản" },
  { key: "bankAccountHolder", label: "Chủ tài khoản" },
];

export default function MyProfilePage() {
  const toast = useToast();
  const user = useAuthStore((s) => s.user);
  const setAvatarUrl = useAuthStore((s) => s.setAvatarUrl); // Ghi vao store chung -> Sidebar tu re-render, khong can F5
  const [form, setForm] = useState<MeUpdateProfileInput>({});
  const [avatarUrl, setAvatarUrlLocal] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : "??";

  const refetch = useCallback(async () => {
    setLoading(true);
    const profile = await meApi.fetchMyProfile();
    if (profile) {
      setForm({
        gender: profile.gender ?? undefined,
        ethnicity: profile.ethnicity ?? undefined,
        religion: profile.religion ?? undefined,
        permanentAddress: profile.permanentAddress ?? undefined,
        currentAddress: profile.currentAddress ?? undefined,
        primaryPhone: profile.primaryPhone ?? undefined,
        email: profile.email ?? undefined,
        emergencyContactName: profile.emergencyContactName ?? undefined,
        emergencyContactPhone: profile.emergencyContactPhone ?? undefined,
        emergencyContactRelation: profile.emergencyContactRelation ?? undefined,
        maritalStatus: profile.maritalStatus ?? undefined,
        educationLevel: profile.educationLevel ?? undefined,
        bankName: profile.bankName ?? undefined,
        bankAccountNumber: profile.bankAccountNumber ?? undefined,
        bankAccountHolder: profile.bankAccountHolder ?? undefined,
      });
      setAvatarUrlLocal(profile.avatarUrl ?? null);
      setAvatarUrl(profile.avatarUrl ?? null); // Dong bo luon vao Sidebar khi vao trang lan dau
    }
    setLoading(false);
  }, [setAvatarUrl]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount, refetch tu setState ben trong
    refetch();
  }, [refetch]);

  function set<K extends keyof MeUpdateProfileInput>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleAvatarUpload(file: File) {
    const profile = await meApi.uploadMyAvatar(file);
    const newUrl = profile.avatarUrl ?? null;
    setAvatarUrlLocal(newUrl);
    setAvatarUrl(newUrl); // Sidebar doc chung state nay -> tu doi anh ngay, khong can F5
    return newUrl ?? "";
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await meApi.updateMyProfile(form);
      toast.success("Đã lưu hồ sơ");
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Hồ sơ của tôi</h1>
      <p className="text-sm text-muted-foreground">
        CCCD và một số thông tin định danh khác chỉ quản lý mới sửa được - liên hệ quản lý nếu cần cập nhật.
      </p>

      {loading ? (
        <p className="text-sm text-muted-foreground">Đang tải...</p>
      ) : (
        <div className="max-w-2xl space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-4 border-b border-border pb-6">
            <AvatarUploader
              avatarUrl={avatarUrl}
              fallbackText={initials}
              size={80}
              onUpload={handleAvatarUpload}
            />
            <div>
              <p className="text-sm font-medium">{user?.email}</p>
              <p className="text-xs text-muted-foreground">Di chuột vào ảnh để đổi avatar (JPEG/PNG/WEBP, tối đa 5MB)</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {FIELDS.map(({ key, label }) => (
              <div key={key} className="space-y-1">
                <Label htmlFor={key}>{label}</Label>
                <Input id={key} value={form[key] ?? ""} onChange={(e) => set(key, e.target.value)} />
              </div>
            ))}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Đang lưu..." : "Lưu hồ sơ"}
          </Button>
        </div>
      )}
    </div>
  );
}