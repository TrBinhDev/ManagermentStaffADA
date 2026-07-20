"use client";

import { useEffect, useState } from "react";
import { useDepartmentStore } from "@/features/department/department.store";
import type { Department } from "@/features/department/department.types";
import { useToast } from "@/components/toast/toast-context";
import { useConfirm } from "@/components/confirm/confirm-context";
import { getErrorMessage } from "@/lib/error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function DepartmentsPage() {
  const { data, total, page, limit, loading, fetchAll, create, update, remove } = useDepartmentStore();
  const toast = useToast();
  const confirm = useConfirm();
  const [name, setName] = useState("");
  const [requestedPage, setRequestedPage] = useState(1);

  const [editTarget, setEditTarget] = useState<Department | null>(null);
  const [editName, setEditName] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    fetchAll({ page: requestedPage, limit: 8 });
  }, [fetchAll, requestedPage]);

  async function handleCreate() {
    if (!name.trim()) return;
    try {
      await create({ name: name.trim() });
      toast.success("Đã thêm phòng ban");
      setName("");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  function openEdit(dept: Department) {
    setEditTarget(dept);
    setEditName(dept.name);
    setEditError(null);
  }

  async function handleSaveEdit() {
    if (!editTarget || !editName.trim()) return;
    try {
      await update(editTarget.id, { name: editName.trim() });
      toast.success("Đã cập nhật phòng ban");
      setEditTarget(null);
    } catch (err) {
      setEditError(getErrorMessage(err));
    }
  }

  async function handleRemove(id: string, name: string) {
    const ok = await confirm({
      title: "Xóa phòng ban",
      description: `Bạn có chắc chắn muốn xóa phòng ban "${name}"? Không thể hoàn tác.`,
      confirmLabel: "Xóa",
      destructive: true,
    });
    if (!ok) return;

    try {
      await remove(id);
      toast.success("Đã xóa phòng ban");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Phòng ban</h1>

      <div className="flex gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tên phòng ban"
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />
        <Button onClick={handleCreate}>Thêm</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tên</TableHead>
            <TableHead className="w-40" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((dept) => (
            <TableRow key={dept.id}>
              <TableCell>{dept.name}</TableCell>
              <TableCell className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(dept)}>
                  Sửa
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleRemove(dept.id, dept.name)}>
                  Xóa
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {loading && <p className="text-sm text-muted-foreground">Đang tải...</p>}

      <PaginationBar page={page} total={total} limit={limit} itemLabel="phòng ban" onPageChange={setRequestedPage} />

      <Dialog open={editTarget !== null} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sửa phòng ban</DialogTitle>
          </DialogHeader>
          <div className="space-y-1">
            <Label htmlFor="editName">Tên phòng ban</Label>
            <Input id="editName" value={editName} onChange={(e) => setEditName(e.target.value)} />
          </div>
          {editError && <p className="text-sm text-destructive">{editError}</p>}
          <DialogFooter>
            <Button onClick={handleSaveEdit}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
