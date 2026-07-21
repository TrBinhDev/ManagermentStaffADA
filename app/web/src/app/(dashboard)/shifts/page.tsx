"use client";

import { useEffect, useState } from "react";
import { useShiftStore } from "@/features/shift/shift.store";
import type { Shift } from "@/features/shift/shift.types";
import { usePositionStore } from "@/features/position/position.store";
import { useShiftPositionCapacities } from "@/features/shift-position-capacity/use-shift-position-capacity";
import * as capacityApi from "@/features/shift-position-capacity/shift-position-capacity.api";
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

const ALL_STATUS = "__all_status__";

export default function ShiftsPage() {
  const { data, total, page, limit, loading, fetchAll, create, update, remove } = useShiftStore();
  const toast = useToast();
  const confirm = useConfirm();
  const positions = usePositionStore((s) => s.data);
  const fetchPositions = usePositionStore((s) => s.fetchAll);

  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [filterIsActive, setFilterIsActive] = useState<boolean | null>(null);
  const [requestedPage, setRequestedPage] = useState(1);

  const [editTarget, setEditTarget] = useState<Shift | null>(null);
  const [editName, setEditName] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  const [capacityTarget, setCapacityTarget] = useState<Shift | null>(null);
  const [newCapPositionId, setNewCapPositionId] = useState("");
  const [newCapMaxStaff, setNewCapMaxStaff] = useState("");
  const [capacityError, setCapacityError] = useState<string | null>(null);
  const {
    data: capacities,
    loading: capacitiesLoading,
    refetch: refetchCapacities,
  } = useShiftPositionCapacities(capacityTarget?.id ?? null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- doi filter thi ve lai trang 1
    setRequestedPage(1);
  }, [filterIsActive]);

  useEffect(() => {
    fetchAll({ isActive: filterIsActive ?? undefined, page: requestedPage, limit: 9 });
  }, [fetchAll, filterIsActive, requestedPage]);

  useEffect(() => {
    fetchPositions({ limit: 100, isActive: true });
  }, [fetchPositions]);

  async function handleCreate() {
    if (!name.trim() || !startTime || !endTime) return;
    try {
      await create({ name: name.trim(), startTime, endTime });
      toast.success("Đã thêm ca làm việc");
      setName("");
      setStartTime("");
      setEndTime("");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  function openEdit(shift: Shift) {
    setEditTarget(shift);
    setEditName(shift.name);
    setEditStartTime(shift.startTime);
    setEditEndTime(shift.endTime);
    setEditError(null);
  }

  async function handleSaveEdit() {
    if (!editTarget || !editName.trim() || !editStartTime || !editEndTime) return;
    try {
      await update(editTarget.id, { name: editName.trim(), startTime: editStartTime, endTime: editEndTime });
      toast.success("Đã cập nhật ca làm việc");
      setEditTarget(null);
    } catch (err) {
      setEditError(getErrorMessage(err));
    }
  }

  async function handleToggleActive(shift: Shift) {
    try {
      await update(shift.id, { isActive: !shift.isActive });
      toast.success(shift.isActive ? "Đã ẩn ca làm việc" : "Đã hiện lại ca làm việc");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  function openCapacities(shift: Shift) {
    setCapacityTarget(shift);
    setNewCapPositionId("");
    setNewCapMaxStaff("");
    setCapacityError(null);
  }

  async function handleCreateCapacity() {
    if (!capacityTarget) return;
    const maxStaff = Number(newCapMaxStaff);
    if (!newCapPositionId || !newCapMaxStaff || !Number.isInteger(maxStaff) || maxStaff <= 0) {
      setCapacityError("Chọn vị trí và nhập giới hạn số người lớn hơn 0");
      return;
    }
    setCapacityError(null);
    try {
      await capacityApi.createCapacity(capacityTarget.id, { positionId: newCapPositionId, maxStaff });
      toast.success("Đã thêm giới hạn số người");
      setNewCapPositionId("");
      setNewCapMaxStaff("");
      await refetchCapacities();
    } catch (err) {
      setCapacityError(getErrorMessage(err));
    }
  }

  async function handleUpdateCapacity(capacityId: string, maxStaff: number) {
    if (!capacityTarget) return;
    try {
      await capacityApi.updateCapacity(capacityTarget.id, capacityId, { maxStaff });
      toast.success("Đã cập nhật giới hạn số người");
      await refetchCapacities();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function handleDeleteCapacity(capacityId: string) {
    if (!capacityTarget) return;
    const ok = await confirm({
      title: "Xóa giới hạn số người",
      description: "Bạn có chắc chắn muốn xóa giới hạn này? Vị trí sẽ không bị giới hạn số người trong ca này nữa.",
      confirmLabel: "Xóa",
      destructive: true,
    });
    if (!ok) return;

    try {
      await capacityApi.deleteCapacity(capacityTarget.id, capacityId);
      toast.success("Đã xóa giới hạn số người");
      await refetchCapacities();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function handleRemove(id: string, name: string) {
    const ok = await confirm({
      title: "Xóa ca làm việc",
      description: `Bạn có chắc chắn muốn xóa ca "${name}"? Không thể hoàn tác.`,
      confirmLabel: "Xóa",
      destructive: true,
    });
    if (!ok) return;

    try {
      await remove(id);
      toast.success("Đã xóa ca làm việc");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Ca làm việc</h1>

      <div className="space-y-1 rounded-xl border border-border/60 bg-card/60 p-3">
        <p className="text-xs text-muted-foreground">Trạng thái</p>
        <Select
          value={filterIsActive === null ? ALL_STATUS : String(filterIsActive)}
          onValueChange={(v) => setFilterIsActive(v === ALL_STATUS ? null : v === "true")}
        >
          <SelectTrigger className="w-40">
            <SelectValue>
              {(value: string) => ({ [ALL_STATUS]: "Tất cả", true: "Đang dùng", false: "Đã ẩn" })[value] ?? value}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_STATUS}>Tất cả</SelectItem>
            <SelectItem value="true">Đang dùng</SelectItem>
            <SelectItem value="false">Đã ẩn</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-end gap-2 rounded-xl border border-border/60 bg-card/60 p-3">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Tên ca</p>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Ca sáng" />
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Giờ bắt đầu</p>
          <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Giờ kết thúc</p>
          <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </div>
        <Button onClick={handleCreate}>Thêm</Button>
      </div>

      {!loading && data.length === 0 && (
        <p className="text-sm text-muted-foreground">Chưa có ca làm việc nào.</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {data.map((shift) => (
          <div
            key={shift.id}
            className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/60 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md hover:shadow-primary/10"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="truncate text-base font-semibold" title={shift.name}>
                {shift.name}
              </p>
              <Badge variant={shift.isActive ? "default" : "secondary"} className="shrink-0">
                {shift.isActive ? "Đang dùng" : "Đã ẩn"}
              </Badge>
            </div>
            <Badge variant="secondary" className="w-fit tabular-nums">
              {shift.startTime}–{shift.endTime}
            </Badge>
            <div className="mt-auto flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => openCapacities(shift)}>
                Giới hạn NS
              </Button>
              <Button variant="outline" size="sm" onClick={() => openEdit(shift)}>
                Sửa
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleToggleActive(shift)}>
                {shift.isActive ? "Ẩn" : "Hiện"}
              </Button>
              <Button variant="destructive" size="sm" onClick={() => handleRemove(shift.id, shift.name)}>
                Xóa
              </Button>
            </div>
          </div>
        ))}
      </div>

      {loading && <p className="text-sm text-muted-foreground">Đang tải...</p>}

      <PaginationBar page={page} total={total} limit={limit} itemLabel="ca làm việc" onPageChange={setRequestedPage} />

      <Dialog open={editTarget !== null} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sửa ca làm việc</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="editName">Tên ca</Label>
              <Input id="editName" value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="editStartTime">Giờ bắt đầu</Label>
              <Input
                id="editStartTime"
                type="time"
                value={editStartTime}
                onChange={(e) => setEditStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="editEndTime">Giờ kết thúc</Label>
              <Input
                id="editEndTime"
                type="time"
                value={editEndTime}
                onChange={(e) => setEditEndTime(e.target.value)}
              />
            </div>
            {editError && <p className="text-sm text-destructive">{editError}</p>}
          </div>

          <DialogFooter>
            <Button onClick={handleSaveEdit}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={capacityTarget !== null} onOpenChange={(open) => !open && setCapacityTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Giới hạn nhân sự — {capacityTarget?.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vị trí</TableHead>
                  <TableHead>Tối đa</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {capacities.map((cap) => (
                  <CapacityRow
                    key={cap.id}
                    positionLabel={`${cap.position.name} — ${cap.position.department.name}`}
                    maxStaff={cap.maxStaff}
                    onSave={(value) => handleUpdateCapacity(cap.id, value)}
                    onDelete={() => handleDeleteCapacity(cap.id)}
                  />
                ))}
              </TableBody>
            </Table>

            {capacitiesLoading && <p className="text-sm text-muted-foreground">Đang tải...</p>}
            {!capacitiesLoading && capacities.length === 0 && (
              <p className="text-sm text-muted-foreground">Ca này chưa giới hạn số người cho vị trí nào.</p>
            )}

            <div className="space-y-2 border-t pt-4">
              <Label>Thêm giới hạn mới</Label>
              <div className="flex gap-2">
                <Select value={newCapPositionId} onValueChange={(v) => setNewCapPositionId(v as string)}>
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
                <Input
                  type="number"
                  min="1"
                  className="w-24"
                  placeholder="Tối đa"
                  value={newCapMaxStaff}
                  onChange={(e) => setNewCapMaxStaff(e.target.value)}
                />
                <Button onClick={handleCreateCapacity}>Thêm</Button>
              </div>
              {capacityError && <p className="text-sm text-destructive">{capacityError}</p>}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CapacityRow({
  positionLabel,
  maxStaff,
  onSave,
  onDelete,
}: {
  positionLabel: string;
  maxStaff: number;
  onSave: (value: number) => void;
  onDelete: () => void;
}) {
  const [value, setValue] = useState(String(maxStaff));
  const dirty = Number(value) !== maxStaff && value !== "" && Number.isInteger(Number(value)) && Number(value) > 0;

  return (
    <TableRow>
      <TableCell>{positionLabel}</TableCell>
      <TableCell>
        <Input
          type="number"
          min="1"
          className="w-20"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </TableCell>
      <TableCell className="flex gap-2">
        {dirty && (
          <Button size="sm" variant="outline" onClick={() => onSave(Number(value))}>
            Lưu
          </Button>
        )}
        <Button size="sm" variant="destructive" onClick={onDelete}>
          Xóa
        </Button>
      </TableCell>
    </TableRow>
  );
}
