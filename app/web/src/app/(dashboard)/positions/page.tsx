"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { usePositionStore } from "@/features/position/position.store";
import { useDepartmentStore } from "@/features/department/department.store";
import type { Position } from "@/features/position/position.types";
import { useAuthStore } from "@/features/auth/auth.store";
import { usePositionSalaryRates } from "@/features/position-salary-rate/use-position-salary-rate";
import * as positionSalaryRateApi from "@/features/position-salary-rate/position-salary-rate.api";
import * as employeeApi from "@/features/employee/employee.api";
import type { Employee } from "@/features/employee/employee.types";
import { useToast } from "@/components/toast/toast-context";
import { useConfirm } from "@/components/confirm/confirm-context";
import { getErrorMessage } from "@/lib/error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PaginationBar } from "@/components/ui/pagination-bar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ALL_DEPARTMENTS = "__all__";
const ALL_STATUS = "__all_status__";

// Panel truot tu ben phai, hien danh sach nhan vien theo positionId.
// Tu quan ly loading/data rieng, khong dung chung store voi trang danh sach nhan vien
// de tranh anh huong filter/phan trang cua trang do.
function PositionEmployeesPanel({
  position,
  onClose,
}: {
  position: Position | null;
  onClose: () => void;
}) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"ACTIVE" | null>("ACTIVE");

  useEffect(() => {
    if (!position) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await employeeApi.fetchEmployees({
          positionId: position!.id,
          status: statusFilter ?? undefined,
          limit: 100,
        });
        if (!cancelled) setEmployees(result.data);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [position, statusFilter]);

  const open = position !== null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-card shadow-xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Danh sách nhân viên theo vị trí"
      >
        <div className="flex items-start justify-between gap-2 border-b border-border p-4">
          <div className="min-w-0">
            <p className="truncate text-base font-semibold">
              {position?.name ?? ""}
            </p>
            <p className="truncate text-sm text-muted-foreground">
              {position?.department.name ?? ""}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Đóng"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 border-b border-border p-4">
          <p className="text-xs text-muted-foreground">Trạng thái</p>
          <Select
            value={statusFilter ?? ALL_STATUS}
            onValueChange={(v) =>
              setStatusFilter(v === ALL_STATUS ? null : (v as "ACTIVE"))
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue>
                {(value: string) =>
                  ({
                    [ALL_STATUS]: "Tất cả",
                    ACTIVE: "Đang làm",
                    RESIGNED: "Đã nghỉ",
                  })[value] ?? value
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_STATUS}>Tất cả</SelectItem>
              <SelectItem value="ACTIVE">Đang làm</SelectItem>
              <SelectItem value="RESIGNED">Đã nghỉ</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading && (
            <p className="text-sm text-muted-foreground">Đang tải...</p>
          )}
          {!loading && error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          {!loading && !error && employees.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Không có nhân viên nào ở vị trí này.
            </p>
          )}
          {!loading && !error && employees.length > 0 && (
            <div className="space-y-2">
              {employees.map((emp) => (
                <div
                  key={emp.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {emp.fullName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {emp.code}
                    </p>
                  </div>
                  <Badge
                    variant={emp.status === "ACTIVE" ? "default" : "secondary"}
                    className="shrink-0"
                  >
                    {emp.status === "ACTIVE" ? "Đang làm" : "Đã nghỉ"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function PositionsPage() {
  const {
    data,
    total,
    page,
    limit,
    loading,
    fetchAll,
    create,
    update,
    remove,
  } = usePositionStore();
  const toast = useToast();
  const confirm = useConfirm();
  const role = useAuthStore((s) => s.role);
  const departments = useDepartmentStore((s) => s.data);
  const fetchDepartments = useDepartmentStore((s) => s.fetchAll);

  const [name, setName] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [filterDepartmentId, setFilterDepartmentId] = useState<string | null>(
    null,
  );
  const [filterIsActive, setFilterIsActive] = useState<boolean | null>(null);
  const [filterSearch, setFilterSearch] = useState(""); // Ô nhập tìm theo tên vị trí (raw input)
  const [debouncedSearch, setDebouncedSearch] = useState(""); // Giá trị đã debounce, dùng để gọi API
  const [requestedPage, setRequestedPage] = useState(1);

  const [editTarget, setEditTarget] = useState<Position | null>(null);
  const [editName, setEditName] = useState("");
  const [editDepartmentId, setEditDepartmentId] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  const [panelTarget, setPanelTarget] = useState<Position | null>(null);

  const [salaryTarget, setSalaryTarget] = useState<Position | null>(null);
  const [newHourlyRate, setNewHourlyRate] = useState("");
  const [salaryError, setSalaryError] = useState<string | null>(null);
  const {
    data: salaryRates,
    loading: salaryLoading,
    refetch: refetchSalaryRates,
  } = usePositionSalaryRates(salaryTarget?.id ?? null);

  useEffect(() => {
    fetchDepartments({ limit: 100 });
  }, [fetchDepartments]);

  useEffect(() => {
    // Debounce 400ms tránh gọi API liên tục khi đang gõ
    const timer = setTimeout(() => {
      setDebouncedSearch(filterSearch.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [filterSearch]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- doi filter thi ve lai trang 1
    setRequestedPage(1);
  }, [filterDepartmentId, filterIsActive, debouncedSearch]);

  useEffect(() => {
    fetchAll({
      departmentId: filterDepartmentId ?? undefined,
      isActive: filterIsActive ?? undefined,
      search: debouncedSearch || undefined,
      page: requestedPage,
      limit: 9,
    });
  }, [
    fetchAll,
    filterDepartmentId,
    filterIsActive,
    debouncedSearch,
    requestedPage,
  ]);

  async function handleCreate() {
    if (!name.trim() || !departmentId) return;
    try {
      await create({ name: name.trim(), departmentId });
      toast.success("Đã thêm vị trí");
      setName("");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  function openEdit(pos: Position) {
    setEditTarget(pos);
    setEditName(pos.name);
    setEditDepartmentId(pos.departmentId);
    setEditError(null);
  }

  async function handleSaveEdit() {
    if (!editTarget || !editName.trim() || !editDepartmentId) return;
    try {
      await update(editTarget.id, {
        name: editName.trim(),
        departmentId: editDepartmentId,
      });
      toast.success("Đã cập nhật vị trí");
      setEditTarget(null);
    } catch (err) {
      setEditError(getErrorMessage(err));
    }
  }

  async function handleToggleActive(pos: Position) {
    try {
      await update(pos.id, { isActive: !pos.isActive });
      toast.success(pos.isActive ? "Đã ẩn vị trí" : "Đã hiện lại vị trí");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  function openSalaryRates(pos: Position) {
    setSalaryTarget(pos);
    setNewHourlyRate("");
    setSalaryError(null);
  }

  async function handleCreateSalaryRate() {
    if (!salaryTarget) return;
    const hourlyRate = Number(newHourlyRate);
    if (!newHourlyRate || Number.isNaN(hourlyRate) || hourlyRate <= 0) {
      setSalaryError("Mức lương phải lớn hơn 0");
      return;
    }
    setSalaryError(null);
    try {
      await positionSalaryRateApi.createSalaryRate(salaryTarget.id, {
        hourlyRate,
      });
      toast.success("Đã đặt mức lương mới");
      setNewHourlyRate("");
      await refetchSalaryRates();
    } catch (err) {
      setSalaryError(getErrorMessage(err));
    }
  }

  async function handleRemove(id: string, name: string) {
    const ok = await confirm({
      title: "Xóa vị trí",
      description: `Bạn có chắc chắn muốn xóa vị trí "${name}"? Không thể hoàn tác.`,
      confirmLabel: "Xóa",
      destructive: true,
    });
    if (!ok) return;

    try {
      await remove(id);
      toast.success("Đã xóa vị trí");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Vị trí</h1>

      <div className="flex flex-wrap gap-4 rounded-xl border border-border bg-card p-3">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Lọc theo phòng ban</p>
          <Select
            value={filterDepartmentId ?? ALL_DEPARTMENTS}
            onValueChange={(v) =>
              setFilterDepartmentId(
                v === ALL_DEPARTMENTS ? null : (v as string),
              )
            }
          >
            <SelectTrigger className="w-48">
              <SelectValue>
                {(value: string) =>
                  value === ALL_DEPARTMENTS
                    ? "Tất cả phòng ban"
                    : (departments.find((d) => d.id === value)?.name ??
                      "Tất cả phòng ban")
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
          <p className="text-xs text-muted-foreground">Trạng thái</p>
          <Select
            value={
              filterIsActive === null ? ALL_STATUS : String(filterIsActive)
            }
            onValueChange={(v) =>
              setFilterIsActive(v === ALL_STATUS ? null : v === "true")
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue>
                {(value: string) =>
                  ({
                    [ALL_STATUS]: "Tất cả",
                    true: "Đang dùng",
                    false: "Đã ẩn",
                  })[value] ?? value
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_STATUS}>Tất cả</SelectItem>
              <SelectItem value="true">Đang dùng</SelectItem>
              <SelectItem value="false">Đã ẩn</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Tìm theo tên vị trí</p>
          <Input
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            placeholder="Nhập tên vị trí..."
            className="w-48"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-2 rounded-xl border border-border bg-card p-3">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Tên vị trí</p>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tên vị trí"
          />
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Phòng ban</p>
          <Select
            value={departmentId}
            onValueChange={(v) => setDepartmentId(v as string)}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Chọn phòng ban">
                {(value: string) =>
                  departments.find((d) => d.id === value)?.name ??
                  "Chọn phòng ban"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleCreate}>Thêm</Button>
      </div>

      {!loading && data.length === 0 && (
        <p className="text-sm text-muted-foreground">Chưa có vị trí nào.</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {data.map((pos) => (
          <div
            key={pos.id}
            role="button"
            tabIndex={0}
            onClick={() => setPanelTarget(pos)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setPanelTarget(pos);
              }
            }}
            className="flex cursor-pointer flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <p
                  className="truncate text-base font-semibold"
                  title={pos.name}
                >
                  {pos.name}
                </p>
                <Badge
                  variant={pos.isActive ? "default" : "secondary"}
                  className="shrink-0"
                >
                  {pos.isActive ? "Đang dùng" : "Đã ẩn"}
                </Badge>
              </div>
              <p
                className="truncate text-sm text-muted-foreground"
                title={pos.department.name}
              >
                {pos.department.name}
              </p>
            </div>
            <div
              className="mt-auto flex flex-wrap gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => openSalaryRates(pos)}
              >
                Lương
              </Button>
              <Button variant="outline" size="sm" onClick={() => openEdit(pos)}>
                Sửa
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToggleActive(pos)}
              >
                {pos.isActive ? "Ẩn" : "Hiện"}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleRemove(pos.id, pos.name)}
              >
                Xóa
              </Button>
            </div>
          </div>
        ))}
      </div>

      {loading && <p className="text-sm text-muted-foreground">Đang tải...</p>}

      <PaginationBar
        page={page}
        total={total}
        limit={limit}
        itemLabel="vị trí"
        onPageChange={setRequestedPage}
      />

      <Dialog
        open={editTarget !== null}
        onOpenChange={(open) => !open && setEditTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sửa vị trí</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="editName">Tên vị trí</Label>
              <Input
                id="editName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Phòng ban</Label>
              <Select
                value={editDepartmentId}
                onValueChange={(v) => setEditDepartmentId(v as string)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(value: string) =>
                      departments.find((d) => d.id === value)?.name ??
                      "Chọn phòng ban"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {editError && (
              <p className="text-sm text-destructive">{editError}</p>
            )}
          </div>

          <DialogFooter>
            <Button onClick={handleSaveEdit}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={salaryTarget !== null}
        onOpenChange={(open) => !open && setSalaryTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lương — {salaryTarget?.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mức lương/giờ</TableHead>
                  <TableHead>Từ ngày</TableHead>
                  <TableHead>Đến ngày</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salaryRates.map((rate) => (
                  <TableRow key={rate.id}>
                    <TableCell>
                      {Number(rate.hourlyRate).toLocaleString("vi-VN")}đ
                    </TableCell>
                    <TableCell>
                      {new Date(rate.effectiveFrom).toLocaleDateString("vi-VN")}
                    </TableCell>
                    <TableCell>
                      {rate.effectiveTo
                        ? new Date(rate.effectiveTo).toLocaleDateString("vi-VN")
                        : "Đang áp dụng"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {salaryLoading && (
              <p className="text-sm text-muted-foreground">Đang tải...</p>
            )}
            {!salaryLoading && salaryRates.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Vị trí này chưa có mức lương nào.
              </p>
            )}

            {role === "OWNER" && (
              <div className="space-y-2 border-t pt-4">
                <Label htmlFor="newHourlyRate">Đặt mức lương mới (đ/giờ)</Label>
                <div className="flex gap-2">
                  <Input
                    id="newHourlyRate"
                    type="number"
                    min="0"
                    value={newHourlyRate}
                    onChange={(e) => setNewHourlyRate(e.target.value)}
                    placeholder="VD: 25000"
                  />
                  <Button onClick={handleCreateSalaryRate}>Đặt mức mới</Button>
                </div>
                {salaryError && (
                  <p className="text-sm text-destructive">{salaryError}</p>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <PositionEmployeesPanel
        position={panelTarget}
        onClose={() => setPanelTarget(null)}
      />
    </div>
  );
}
