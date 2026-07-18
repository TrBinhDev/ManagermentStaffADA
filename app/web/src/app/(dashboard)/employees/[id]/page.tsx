"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useAuthStore } from "@/features/auth/auth.store";
import * as employeeApi from "@/features/employee/employee.api";
import type { EmployeeDetail } from "@/features/employee/employee.types";
import { useEmployeeProfile } from "@/features/employee-profile/use-employee-profile";
import * as employeeProfileApi from "@/features/employee-profile/employee-profile.api";
import type { UpsertEmployeeProfileInput } from "@/features/employee-profile/employee-profile.types";
import { usePositionHistory } from "@/features/position-history/use-position-history";
import { useEmploymentPeriods } from "@/features/employment-period/use-employment-period";
import { useToast } from "@/components/toast/toast-context";
import { useConfirm } from "@/components/confirm/confirm-context";
import { getErrorMessage } from "@/lib/error";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "info", label: "Thông tin" },
  { key: "profile", label: "Hồ sơ" },
  { key: "position-history", label: "Lịch sử vị trí" },
  { key: "employment-period", label: "Lịch sử gắn bó" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [tab, setTab] = useState<TabKey>("info");

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Chi tiết nhân viên</h1>

      <div className="flex gap-1 border-b">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "border-b-2 border-transparent px-3 py-2 text-sm text-muted-foreground hover:text-foreground",
              tab === t.key && "border-primary font-medium text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "info" && <InfoTab employeeId={id} />}
      {tab === "profile" && <ProfileTab employeeId={id} />}
      {tab === "position-history" && <PositionHistoryTab employeeId={id} />}
      {tab === "employment-period" && <EmploymentPeriodTab employeeId={id} />}
    </div>
  );
}

function InfoTab({ employeeId }: { employeeId: string }) {
  const toast = useToast();
  const confirm = useConfirm();
  const currentEmployeeId = useAuthStore((s) => s.user?.employeeId ?? null);
  const isSelf = employeeId === currentEmployeeId;
  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    const result = await employeeApi.fetchEmployeeById(employeeId);
    setEmployee(result);
    setLoading(false);
  }, [employeeId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount, refetch tu setState ben trong
    refetch();
  }, [refetch]);

  if (loading || !employee) return <p className="text-sm text-muted-foreground">Đang tải...</p>;

  return (
    <div className="max-w-md space-y-3 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">{employee.fullName}</p>
          <p className="text-sm text-muted-foreground">{employee.code}</p>
        </div>
        <Badge variant={employee.status === "ACTIVE" ? "default" : "secondary"}>
          {employee.status === "ACTIVE" ? "Đang làm" : "Đã nghỉ"}
        </Badge>
      </div>

      <div className="space-y-1 text-sm">
        <p>
          <span className="text-muted-foreground">Vị trí: </span>
          {employee.position.name}
        </p>
        <p>
          <span className="text-muted-foreground">Phòng ban: </span>
          {employee.position.department.name}
        </p>
        {employee.dob && (
          <p>
            <span className="text-muted-foreground">Ngày sinh: </span>
            {new Date(employee.dob).toLocaleDateString("vi-VN")}
          </p>
        )}
      </div>

      <div className="flex gap-2 pt-2">
        {employee.status === "ACTIVE" ? (
          !isSelf && (
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              const ok = await confirm({
                title: "Cho nghỉ việc",
                description: `Bạn có chắc chắn muốn cho "${employee.fullName}" nghỉ việc không?`,
                confirmLabel: "Cho nghỉ việc",
                destructive: true,
              });
              if (!ok) return;

              try {
                await employeeApi.resignEmployee(employeeId);
                toast.success("Đã cho nhân viên nghỉ việc");
                refetch();
              } catch (err) {
                toast.error(getErrorMessage(err));
              }
            }}
          >
            Cho nghỉ việc
          </Button>
          )
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                await employeeApi.rehireEmployee(employeeId);
                toast.success("Đã thuê lại nhân viên");
                refetch();
              } catch (err) {
                toast.error(getErrorMessage(err));
              }
            }}
          >
            Thuê lại
          </Button>
        )}
      </div>
    </div>
  );
}

function ProfileTab({ employeeId }: { employeeId: string }) {
  const toast = useToast();
  const { data: profile, loading, refetch } = useEmployeeProfile(employeeId);
  const [form, setForm] = useState<UpsertEmployeeProfileInput>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- dong bo form khi profile tu API load xong
      setForm({
        cccd: profile.cccd,
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
        cccdIssuePlace: profile.cccdIssuePlace ?? undefined,
        bankName: profile.bankName ?? undefined,
        bankAccountNumber: profile.bankAccountNumber ?? undefined,
        bankAccountHolder: profile.bankAccountHolder ?? undefined,
        note: profile.note ?? undefined,
      });
    }
  }, [profile]);

  function set<K extends keyof UpsertEmployeeProfileInput>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await employeeProfileApi.upsertProfile(employeeId, form);
      toast.success("Đã lưu hồ sơ");
      refetch();
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Đang tải...</p>;

  const fields: Array<{ key: keyof UpsertEmployeeProfileInput; label: string }> = [
    { key: "cccd", label: "CCCD" },
    { key: "gender", label: "Giới tính" },
    { key: "ethnicity", label: "Dân tộc" },
    { key: "religion", label: "Tôn giáo" },
    { key: "permanentAddress", label: "Địa chỉ thường trú" },
    { key: "currentAddress", label: "Địa chỉ hiện tại" },
    { key: "primaryPhone", label: "Số điện thoại" },
    { key: "email", label: "Email" },
    { key: "emergencyContactName", label: "Người liên hệ khẩn cấp" },
    { key: "emergencyContactPhone", label: "SĐT liên hệ khẩn cấp" },
    { key: "emergencyContactRelation", label: "Quan hệ" },
    { key: "maritalStatus", label: "Tình trạng hôn nhân" },
    { key: "educationLevel", label: "Trình độ học vấn" },
    { key: "cccdIssuePlace", label: "Nơi cấp CCCD" },
    { key: "bankName", label: "Ngân hàng" },
    { key: "bankAccountNumber", label: "Số tài khoản" },
    { key: "bankAccountHolder", label: "Chủ tài khoản" },
    { key: "note", label: "Ghi chú" },
  ];

  return (
    <div className="max-w-2xl space-y-4 rounded-lg border p-4">
      <div className="grid grid-cols-2 gap-3">
        {fields.map(({ key, label }) => (
          <div key={key} className="space-y-1">
            <Label htmlFor={key}>{label}</Label>
            <Input
              id={key}
              value={form[key] ?? ""}
              onChange={(e) => set(key, e.target.value)}
              maxLength={key === "cccd" ? 12 : undefined}
            />
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button onClick={handleSave} disabled={saving}>
        {saving ? "Đang lưu..." : "Lưu hồ sơ"}
      </Button>
    </div>
  );
}

function PositionHistoryTab({ employeeId }: { employeeId: string }) {
  const { data, loading } = usePositionHistory(employeeId);

  if (loading) return <p className="text-sm text-muted-foreground">Đang tải...</p>;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Vị trí</TableHead>
          <TableHead>Từ ngày</TableHead>
          <TableHead>Đến ngày</TableHead>
          <TableHead>Số ngày</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row) => (
          <TableRow key={row.id}>
            <TableCell>{row.position.name}</TableCell>
            <TableCell>{new Date(row.startDate).toLocaleDateString("vi-VN")}</TableCell>
            <TableCell>{row.endDate ? new Date(row.endDate).toLocaleDateString("vi-VN") : "Đang giữ"}</TableCell>
            <TableCell>{row.days}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function EmploymentPeriodTab({ employeeId }: { employeeId: string }) {
  const { data, loading } = useEmploymentPeriods(employeeId);

  if (loading) return <p className="text-sm text-muted-foreground">Đang tải...</p>;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Từ ngày</TableHead>
          <TableHead>Đến ngày</TableHead>
          <TableHead>Số ngày</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row) => (
          <TableRow key={row.id}>
            <TableCell>{new Date(row.startDate).toLocaleDateString("vi-VN")}</TableCell>
            <TableCell>{row.endDate ? new Date(row.endDate).toLocaleDateString("vi-VN") : "Đang làm"}</TableCell>
            <TableCell>{row.days}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
