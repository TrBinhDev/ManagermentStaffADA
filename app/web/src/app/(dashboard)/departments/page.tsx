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
    fetchAll({ page: requestedPage, limit: 9 });
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

      <div className="flex gap-2 rounded-xl border border-border/60 bg-card/60 p-3">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tên phòng ban"
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />
        <Button onClick={handleCreate}>Thêm</Button>
      </div>

      {!loading && data.length === 0 && (
        <p className="text-sm text-muted-foreground">Chưa có phòng ban nào.</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {data.map((dept) => (
          <div
            key={dept.id}
            className="group flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/60 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md hover:shadow-primary/10"
          >
            <p className="truncate text-base font-semibold" title={dept.name}>
              {dept.name}
            </p>
            <div className="mt-auto flex gap-2">
              <Button variant="outline" size="sm" onClick={() => openEdit(dept)}>
                Sửa
              </Button>
              <Button variant="destructive" size="sm" onClick={() => handleRemove(dept.id, dept.name)}>
                Xóa
              </Button>
            </div>
          </div>
        ))}
      </div>

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
