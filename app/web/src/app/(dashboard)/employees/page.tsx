"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/features/auth/auth.store";
import { useEmployeeStore } from "@/features/employee/employee.store";
import { usePositionStore } from "@/features/position/position.store";
import { useDepartmentStore } from "@/features/department/department.store";
import * as employeeApi from "@/features/employee/employee.api";
import * as managerAccountApi from "@/features/manager-account/manager-account.api";
import type { Employee, EmployeeStatus } from "@/features/employee/employee.types";
import { useToast } from "@/components/toast/toast-context";
import { useConfirm } from "@/components/confirm/confirm-context";
import { getErrorMessage } from "@/lib/error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const ALL_DEPARTMENTS = "__all__";

export default function EmployeesPage() {
  const router = useRouter();
  const { data, total, page, limit, loading, fetchAll, create, update, resign, rehire } = useEmployeeStore();
  const toast = useToast();
  const confirm = useConfirm();
  const currentEmployeeId = useAuthStore((s) => s.user?.employeeId ?? null);
  const positions = usePositionStore((s) => s.data);
  const fetchPositions = usePositionStore((s) => s.fetchAll);
  const departments = useDepartmentStore((s) => s.data);
  const fetchDepartments = useDepartmentStore((s) => s.fetchAll);

  const [status, setStatus] = useState<EmployeeStatus | "ALL">("ACTIVE");
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [requestedPage, setRequestedPage] = useState(1);

  const [open, setOpen] = useState(false);
  const [cccd, setCccd] = useState("");
  const [fullName, setFullName] = useState("");
  const [positionId, setPositionId] = useState("");
  const [createAccount, setCreateAccount] = useState(false);
  const [accountEmail, setAccountEmail] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const [editTarget, setEditTarget] = useState<Employee | null>(null);
  const [editFullName, setEditFullName] = useState("");
  const [editPositionId, setEditPositionId] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    // isActive: true — chi hien vi tri dang dung de chon, vi tri da an van hien thi dung ten
    // qua employee.position tra ve tu API (khong phu thuoc list nay), chi khong chon MOI duoc thoi.
    fetchPositions({ limit: 100, isActive: true });
    fetchDepartments({ limit: 100 });
  }, [fetchPositions, fetchDepartments]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- doi filter thi ve lai trang 1
    setRequestedPage(1);
  }, [status, departmentId, search]);

  useEffect(() => {
    fetchAll({
      status: status === "ALL" ? undefined : status,
      departmentId: departmentId ?? undefined,
      search: search || undefined,
      page: requestedPage,
      limit: 9,
    });
  }, [fetchAll, status, departmentId, search, requestedPage]);

  async function handleCreate() {
    setFormError(null);
    if (!cccd.trim() || !fullName.trim() || !positionId) return;
    if (createAccount && (!accountEmail.trim() || !accountPassword.trim())) {
      setFormError("Nhập đầy đủ email và mật khẩu để tạo tài khoản đăng nhập");
      return;
    }
    try {
      if (createAccount) {
        // Tao Employee truoc de lay id, roi tao ManagerAccount role STAFF gan voi id do luon -
        // gop 2 buoc thanh 1 luong duy nhat thay vi phai qua trang Tai khoan quan ly rieng sau.
        const emp = await employeeApi.createEmployee({ cccd: cccd.trim(), fullName: fullName.trim(), positionId });
        await managerAccountApi.createManagerAccount({
          email: accountEmail.trim(),
          password: accountPassword,
          role: "STAFF",
          employeeId: emp.id,
        });
        await fetchAll({
          status: status === "ALL" ? undefined : status,
          departmentId: departmentId ?? undefined,
          search: search || undefined,
          page: requestedPage,
          limit: 9,
        });
      } else {
        await create({ cccd: cccd.trim(), fullName: fullName.trim(), positionId });
      }
      toast.success(createAccount ? "Đã thêm nhân viên và tài khoản đăng nhập" : "Đã thêm nhân viên");
      setCccd("");
      setFullName("");
      setPositionId("");
      setCreateAccount(false);
      setAccountEmail("");
      setAccountPassword("");
      setOpen(false);
    } catch (err) {
      setFormError(getErrorMessage(err));
    }
  }

  async function handleResign(id: string, name: string) {
    const ok = await confirm({
      title: "Cho nghỉ việc",
      description: `Bạn có chắc chắn muốn cho "${name}" nghỉ việc không?`,
      confirmLabel: "Cho nghỉ việc",
      destructive: true,
    });
    if (!ok) return;

    try {
      await resign(id);
      toast.success("Đã cho nhân viên nghỉ việc");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function handleRehire(id: string) {
    try {
      await rehire(id);
      toast.success("Đã thuê lại nhân viên");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  function openEdit(emp: Employee) {
    setEditTarget(emp);
    setEditFullName(emp.fullName);
    setEditPositionId(emp.positionId);
    setEditError(null);
  }

  async function handleSaveEdit() {
    if (!editTarget || !editFullName.trim() || !editPositionId) return;
    try {
      await update(editTarget.id, { fullName: editFullName.trim(), positionId: editPositionId });
      toast.success("Đã cập nhật nhân viên");
      setEditTarget(null);
    } catch (err) {
      setEditError(getErrorMessage(err));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Nhân viên</h1>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}>Thêm nhân viên</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thêm nhân viên</DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="cccd">CCCD</Label>
                <Input id="cccd" value={cccd} onChange={(e) => setCccd(e.target.value)} maxLength={12} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="fullName">Họ tên</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Vị trí</Label>
                <Select value={positionId} onValueChange={(v) => setPositionId(v as string)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn vị trí">
                      {(value: string) => {
                        const p = positions.find((x) => x.id === value);
                        return p ? `${p.name} — ${p.department.name}` : "Chọn vị trí";
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} — {p.department.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={createAccount}
                  onChange={(e) => setCreateAccount(e.target.checked)}
                  className="size-4 rounded border-input"
                />
                Tạo tài khoản đăng nhập luôn (nhân viên tự xem lương/lịch làm)
              </label>

              {createAccount && (
                <div className="space-y-3 rounded-lg border border-border/60 p-3">
                  <div className="space-y-1">
                    <Label htmlFor="accountEmail">Email đăng nhập</Label>
                    <Input
                      id="accountEmail"
                      type="email"
                      value={accountEmail}
                      onChange={(e) => setAccountEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="accountPassword">Mật khẩu ban đầu</Label>
                    <Input
                      id="accountPassword"
                      type="password"
                      value={accountPassword}
                      onChange={(e) => setAccountPassword(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {formError && <p className="text-sm text-destructive">{formError}</p>}
            </div>

            <DialogFooter>
              <Button onClick={handleCreate}>Tạo</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap items-end gap-2 rounded-xl border border-border/60 bg-card/60 p-3">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Trạng thái</p>
          <Select value={status} onValueChange={(v) => setStatus(v as EmployeeStatus | "ALL")}>
            <SelectTrigger className="w-40">
              <SelectValue>
                {(value: string) =>
                  ({ ACTIVE: "Đang làm việc", RESIGNED: "Đã nghỉ việc", ALL: "Tất cả" })[value] ?? value
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Đang làm việc</SelectItem>
              <SelectItem value="RESIGNED">Đã nghỉ việc</SelectItem>
              <SelectItem value="ALL">Tất cả</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Phòng ban</p>
          <Select
            value={departmentId ?? ALL_DEPARTMENTS}
            onValueChange={(v) => setDepartmentId(v === ALL_DEPARTMENTS ? null : (v as string))}
          >
            <SelectTrigger className="w-48">
              <SelectValue>
                {(value: string) =>
                  value === ALL_DEPARTMENTS
                    ? "Tất cả phòng ban"
                    : (departments.find((d) => d.id === value)?.name ?? "Tất cả phòng ban")
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_DEPARTMENTS}>Tất cả phòng ban</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Tìm theo mã/tên</p>
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="NV0001, Nguyễn..." />
        </div>
      </div>

      {!loading && data.length === 0 && <p className="text-sm text-muted-foreground">Chưa có nhân viên nào.</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {data.map((emp) => (
          <div
            key={emp.id}
            role="button"
            tabIndex={0}
            onClick={() => router.push(`/employees/${emp.id}`)}
            onKeyDown={(e) => e.key === "Enter" && router.push(`/employees/${emp.id}`)}
            className="flex cursor-pointer flex-col gap-2 rounded-2xl border border-border/60 bg-card/60 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md hover:shadow-primary/10"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="truncate font-semibold text-primary" title={emp.code}>
                {emp.code}
              </p>
              <Badge variant={emp.status === "ACTIVE" ? "default" : "secondary"} className="shrink-0">
                {emp.status === "ACTIVE" ? "Đang làm" : "Đã nghỉ"}
              </Badge>
            </div>
            <p className="truncate text-sm text-muted-foreground" title={emp.fullName}>
              {emp.fullName}
            </p>
            <div className="mt-auto flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
              {emp.id !== currentEmployeeId && (
                <Button variant="outline" size="sm" onClick={() => openEdit(emp)}>
                  Sửa
                </Button>
              )}
              {emp.status === "ACTIVE" ? (
                emp.id !== currentEmployeeId && (
                  <Button variant="outline" size="sm" onClick={() => handleResign(emp.id, emp.fullName)}>
                    Cho nghỉ việc
                  </Button>
                )
              ) : (
                <Button variant="outline" size="sm" onClick={() => handleRehire(emp.id)}>
                  Thuê lại
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {loading && <p className="text-sm text-muted-foreground">Đang tải...</p>}

      <PaginationBar page={page} total={total} limit={limit} itemLabel="nhân viên" onPageChange={setRequestedPage} />

      <Dialog open={editTarget !== null} onOpenChange={(v) => !v && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sửa nhân viên</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="editFullName">Họ tên</Label>
              <Input id="editFullName" value={editFullName} onChange={(e) => setEditFullName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Vị trí</Label>
              <Select value={editPositionId} onValueChange={(v) => setEditPositionId(v as string)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn vị trí">
                    {(value: string) => {
                      const p = positions.find((x) => x.id === value);
                      return p ? `${p.name} — ${p.department.name}` : "Chọn vị trí";
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {positions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} — {p.department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {editError && <p className="text-sm text-destructive">{editError}</p>}
          </div>

          <DialogFooter>
            <Button onClick={handleSaveEdit}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
