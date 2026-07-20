"use client";

import { useEffect, useState } from "react";
import { useShiftStore } from "@/features/shift/shift.store";
import type { Shift } from "@/features/shift/shift.types";
import { useToast } from "@/components/toast/toast-context";
import { useConfirm } from "@/components/confirm/confirm-context";
import { getErrorMessage } from "@/lib/error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const ALL_STATUS = "__all_status__";

export default function ShiftsPage() {
  const { data, loading, fetchAll, create, update, remove } = useShiftStore();
  const toast = useToast();
  const confirm = useConfirm();

  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [filterIsActive, setFilterIsActive] = useState<boolean | null>(null);

  const [editTarget, setEditTarget] = useState<Shift | null>(null);
  const [editName, setEditName] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    fetchAll({ isActive: filterIsActive ?? undefined });
  }, [fetchAll, filterIsActive]);

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

      <div className="space-y-1">
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

      <div className="flex flex-wrap items-end gap-2 rounded-lg border p-3">
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

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tên ca</TableHead>
            <TableHead>Giờ bắt đầu</TableHead>
            <TableHead>Giờ kết thúc</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead className="w-64" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((shift) => (
            <TableRow key={shift.id}>
              <TableCell>{shift.name}</TableCell>
              <TableCell>{shift.startTime}</TableCell>
              <TableCell>{shift.endTime}</TableCell>
              <TableCell>
                <Badge variant={shift.isActive ? "default" : "secondary"}>
                  {shift.isActive ? "Đang dùng" : "Đã ẩn"}
                </Badge>
              </TableCell>
              <TableCell className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(shift)}>
                  Sửa
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleToggleActive(shift)}>
                  {shift.isActive ? "Ẩn" : "Hiện"}
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleRemove(shift.id, shift.name)}>
                  Xóa
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {loading && <p className="text-sm text-muted-foreground">Đang tải...</p>}

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
    </div>
  );
}
