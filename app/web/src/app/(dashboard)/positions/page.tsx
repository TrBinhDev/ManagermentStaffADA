"use client";

import { useEffect, useState } from "react";
import { usePositionStore } from "@/features/position/position.store";
import { useDepartmentStore } from "@/features/department/department.store";
import type { Position } from "@/features/position/position.types";
import { useAuthStore } from "@/features/auth/auth.store";
import { usePositionSalaryRates } from "@/features/position-salary-rate/use-position-salary-rate";
import * as positionSalaryRateApi from "@/features/position-salary-rate/position-salary-rate.api";
import { useToast } from "@/components/toast/toast-context";
import { useConfirm } from "@/components/confirm/confirm-context";
import { getErrorMessage } from "@/lib/error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const ALL_DEPARTMENTS = "__all__";
const ALL_STATUS = "__all_status__";

export default function PositionsPage() {
  const { data, total, page, limit, loading, fetchAll, create, update, remove } = usePositionStore();
  const toast = useToast();
  const confirm = useConfirm();
  const role = useAuthStore((s) => s.role);
  const departments = useDepartmentStore((s) => s.data);
  const fetchDepartments = useDepartmentStore((s) => s.fetchAll);

  const [name, setName] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [filterDepartmentId, setFilterDepartmentId] = useState<string | null>(null);
  const [filterIsActive, setFilterIsActive] = useState<boolean | null>(null);
  const [requestedPage, setRequestedPage] = useState(1);

  const [editTarget, setEditTarget] = useState<Position | null>(null);
  const [editName, setEditName] = useState("");
  const [editDepartmentId, setEditDepartmentId] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- doi filter thi ve lai trang 1
    setRequestedPage(1);
  }, [filterDepartmentId, filterIsActive]);

  useEffect(() => {
    fetchAll({
      departmentId: filterDepartmentId ?? undefined,
      isActive: filterIsActive ?? undefined,
      page: requestedPage,
      limit: 8,
    });
  }, [fetchAll, filterDepartmentId, filterIsActive, requestedPage]);

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
      await update(editTarget.id, { name: editName.trim(), departmentId: editDepartmentId });
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
      await positionSalaryRateApi.createSalaryRate(salaryTarget.id, { hourlyRate });
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
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Vị trí</h1>

      <div className="flex flex-wrap gap-4">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Lọc theo phòng ban</p>
          <Select
            value={filterDepartmentId ?? ALL_DEPARTMENTS}
            onValueChange={(v) => setFilterDepartmentId(v === ALL_DEPARTMENTS ? null : (v as string))}
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
          <p className="text-xs text-muted-foreground">Trạng thái</p>
          <Select
            value={filterIsActive === null ? ALL_STATUS : String(filterIsActive)}
            onValueChange={(v) => setFilterIsActive(v === ALL_STATUS ? null : v === "true")}
          >
            <SelectTrigger className="w-40">
              <SelectValue>
                {(value: string) =>
                  ({ [ALL_STATUS]: "Tất cả", true: "Đang dùng", false: "Đã ẩn" })[value] ?? value
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
      </div>

      <div className="flex flex-wrap items-end gap-2 rounded-lg border p-3">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Tên vị trí</p>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên vị trí" />
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Phòng ban</p>
          <Select value={departmentId} onValueChange={(v) => setDepartmentId(v as string)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Chọn phòng ban">
                {(value: string) => departments.find((d) => d.id === value)?.name ?? "Chọn phòng ban"}
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

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tên</TableHead>
            <TableHead>Phòng ban</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead className="w-80" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((pos) => (
            <TableRow key={pos.id}>
              <TableCell>{pos.name}</TableCell>
              <TableCell>{pos.department.name}</TableCell>
              <TableCell>
                <Badge variant={pos.isActive ? "default" : "secondary"}>
                  {pos.isActive ? "Đang dùng" : "Đã ẩn"}
                </Badge>
              </TableCell>
              <TableCell className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => openSalaryRates(pos)}>
                  Lương
                </Button>
                <Button variant="outline" size="sm" onClick={() => openEdit(pos)}>
                  Sửa
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleToggleActive(pos)}>
                  {pos.isActive ? "Ẩn" : "Hiện"}
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleRemove(pos.id, pos.name)}>
                  Xóa
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {loading && <p className="text-sm text-muted-foreground">Đang tải...</p>}

      <PaginationBar page={page} total={total} limit={limit} itemLabel="vị trí" onPageChange={setRequestedPage} />

      <Dialog open={editTarget !== null} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sửa vị trí</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="editName">Tên vị trí</Label>
              <Input id="editName" value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Phòng ban</Label>
              <Select value={editDepartmentId} onValueChange={(v) => setEditDepartmentId(v as string)}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(value: string) => departments.find((d) => d.id === value)?.name ?? "Chọn phòng ban"}
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
            {editError && <p className="text-sm text-destructive">{editError}</p>}
          </div>

          <DialogFooter>
            <Button onClick={handleSaveEdit}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={salaryTarget !== null} onOpenChange={(open) => !open && setSalaryTarget(null)}>
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
                    <TableCell>{Number(rate.hourlyRate).toLocaleString("vi-VN")}đ</TableCell>
                    <TableCell>{new Date(rate.effectiveFrom).toLocaleDateString("vi-VN")}</TableCell>
                    <TableCell>
                      {rate.effectiveTo ? new Date(rate.effectiveTo).toLocaleDateString("vi-VN") : "Đang áp dụng"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {salaryLoading && <p className="text-sm text-muted-foreground">Đang tải...</p>}
            {!salaryLoading && salaryRates.length === 0 && (
              <p className="text-sm text-muted-foreground">Vị trí này chưa có mức lương nào.</p>
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
                {salaryError && <p className="text-sm text-destructive">{salaryError}</p>}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
