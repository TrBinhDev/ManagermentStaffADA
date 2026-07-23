"use client";

import { useCallback, useEffect, useState } from "react";
import * as meApi from "@/features/me/me.api";
import type { MeUpdateProfileInput } from "@/features/me/me.types";
import { useToast } from "@/components/toast/toast-context";
import { getErrorMessage } from "@/lib/error";
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
  const [form, setForm] = useState<MeUpdateProfileInput>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount, refetch tu setState ben trong
    refetch();
  }, [refetch]);

  function set<K extends keyof MeUpdateProfileInput>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
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
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Hồ sơ của tôi</h1>
      <p className="text-sm text-muted-foreground">
        CCCD và một số thông tin định danh khác chỉ quản lý mới sửa được - liên hệ quản lý nếu cần cập nhật.
      </p>

      {loading ? (
        <p className="text-sm text-muted-foreground">Đang tải...</p>
      ) : (
        <div className="max-w-2xl space-y-4 rounded-lg border p-4">
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
