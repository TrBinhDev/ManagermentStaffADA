"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useDepartmentStore } from "@/features/department/department.store";
import type { Department } from "@/features/department/department.types";
import * as positionApi from "@/features/position/position.api";
import type { Position } from "@/features/position/position.types";
import { useToast } from "@/components/toast/toast-context";
import { useConfirm } from "@/components/confirm/confirm-context";
import { getErrorMessage } from "@/lib/error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PaginationBar } from "@/components/ui/pagination-bar";
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

const ALL_STATUS = "__all_status__";

// Panel truot tu ben phai, hien danh sach vi tri thuoc phong ban duoc chon.
// Tu quan ly loading/data rieng, khong dung chung store voi trang Vi tri
// de tranh anh huong filter/phan trang cua trang do.
function DepartmentPositionsPanel({
  department,
  onClose,
}: {
  department: Department | null;
  onClose: () => void;
}) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<boolean | null>(true);

  useEffect(() => {
    if (!department) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await positionApi.fetchPositions({
          departmentId: department!.id,
          isActive: statusFilter ?? undefined,
          limit: 100,
        });
        if (!cancelled) setPositions(result.data);
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
  }, [department, statusFilter]);

  const open = department !== null;

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
        aria-label="Danh sách vị trí theo phòng ban"
      >
        <div className="flex items-start justify-between gap-2 border-b border-border p-4">
          <p className="truncate text-base font-semibold">
            {department?.name ?? ""}
          </p>
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
            value={statusFilter === null ? ALL_STATUS : String(statusFilter)}
            onValueChange={(v) =>
              setStatusFilter(v === ALL_STATUS ? null : v === "true")
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

        <div className="flex-1 overflow-y-auto p-4">
          {loading && (
            <p className="text-sm text-muted-foreground">Đang tải...</p>
          )}
          {!loading && error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          {!loading && !error && positions.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Phòng ban này chưa có vị trí nào.
            </p>
          )}
          {!loading && !error && positions.length > 0 && (
            <div className="space-y-2">
              {positions.map((pos) => (
                <div
                  key={pos.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border p-3"
                >
                  <p className="truncate text-sm font-medium">{pos.name}</p>
                  <Badge
                    variant={pos.isActive ? "default" : "secondary"}
                    className="shrink-0"
                  >
                    {pos.isActive ? "Đang dùng" : "Đã ẩn"}
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

export default function DepartmentsPage() {
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
  } = useDepartmentStore();
  const toast = useToast();
  const confirm = useConfirm();
  const [name, setName] = useState("");
  const [filterSearch, setFilterSearch] = useState(""); // Ô nhập tìm theo tên phòng ban (raw input)
  const [debouncedSearch, setDebouncedSearch] = useState(""); // Giá trị đã debounce, dùng để gọi API
  const [requestedPage, setRequestedPage] = useState(1);
  const [panelTarget, setPanelTarget] = useState<Department | null>(null);

  const [editTarget, setEditTarget] = useState<Department | null>(null);
  const [editName, setEditName] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    // Debounce 400ms tránh gọi API liên tục khi đang gõ
    const timer = setTimeout(() => {
      setDebouncedSearch(filterSearch.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [filterSearch]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- doi search thi ve lai trang 1
    setRequestedPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    fetchAll({
      search: debouncedSearch || undefined,
      page: requestedPage,
      limit: 9,
    });
  }, [fetchAll, debouncedSearch, requestedPage]);

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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Phòng ban</h1>

      <div className="flex flex-wrap gap-4 rounded-xl border border-border bg-card p-3">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">
            Tìm theo tên phòng ban
          </p>
          <Input
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            placeholder="Nhập tên phòng ban..."
            className="w-48"
          />
        </div>
      </div>

      <div className="flex gap-2 rounded-xl border border-border bg-card p-3">
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
            role="button"
            tabIndex={0}
            onClick={() => setPanelTarget(dept)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setPanelTarget(dept);
              }
            }}
            className="group flex cursor-pointer flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <p className="truncate text-base font-semibold" title={dept.name}>
              {dept.name}
            </p>
            <div
              className="mt-auto flex gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => openEdit(dept)}
              >
                Sửa
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleRemove(dept.id, dept.name)}
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
        itemLabel="phòng ban"
        onPageChange={setRequestedPage}
      />

      <Dialog
        open={editTarget !== null}
        onOpenChange={(open) => !open && setEditTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sửa phòng ban</DialogTitle>
          </DialogHeader>
          <div className="space-y-1">
            <Label htmlFor="editName">Tên phòng ban</Label>
            <Input
              id="editName"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          </div>
          {editError && <p className="text-sm text-destructive">{editError}</p>}
          <DialogFooter>
            <Button onClick={handleSaveEdit}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DepartmentPositionsPanel
        department={panelTarget}
        onClose={() => setPanelTarget(null)}
      />
    </div>
  );
}
