"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/features/auth/auth.store";
import { useManagerAccountStore } from "@/features/manager-account/manager-account.store";
import { useEmployeeStore } from "@/features/employee/employee.store";
import { useToast } from "@/components/toast/toast-context";
import { useConfirm } from "@/components/confirm/confirm-context";
import { getErrorMessage } from "@/lib/error";
import { ROUTES } from "@/constants/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const NONE_EMPLOYEE = "__none__";

export default function ManagerAccountsPage() {
  const router = useRouter();
  const role = useAuthStore((s) => s.role);

  useEffect(() => {
    if (role && role !== "OWNER") {
      router.replace(ROUTES.departments);
    }
  }, [role, router]);

  if (role !== "OWNER") {
    return null;
  }

  return <ManagerAccountsContent />;
}

function ManagerAccountsContent() {
  const { data, total, page, limit, loading, fetchAll, create, setActive, resetPassword, remove } =
    useManagerAccountStore();
  const toast = useToast();
  const confirm = useConfirm();
  const employees = useEmployeeStore((s) => s.data);
  const fetchEmployees = useEmployeeStore((s) => s.fetchAll);

  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [employeeId, setEmployeeId] = useState(NONE_EMPLOYEE);
  const [formError, setFormError] = useState<string | null>(null);
  const [requestedPage, setRequestedPage] = useState(1);

  const [resetTarget, setResetTarget] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    fetchAll({ page: requestedPage, limit: 8 });
  }, [fetchAll, requestedPage]);

  useEffect(() => {
    fetchEmployees({ status: "ACTIVE", limit: 100 });
  }, [fetchEmployees]);

  async function handleCreate() {
    setFormError(null);
    if (!email.trim() || !password.trim()) return;
    try {
      await create({
        email: email.trim(),
        password,
        role: "MANAGER",
        employeeId: employeeId === NONE_EMPLOYEE ? undefined : employeeId,
      });
      toast.success("Đã thêm tài khoản quản lý");
      setEmail("");
      setPassword("");
      setEmployeeId(NONE_EMPLOYEE);
      setOpen(false);
    } catch (err) {
      setFormError(getErrorMessage(err));
    }
  }

  async function handleResetPassword() {
    if (!resetTarget || !newPassword.trim()) return;
    try {
      await resetPassword(resetTarget, { newPassword });
      toast.success("Đã đặt lại mật khẩu");
      setResetTarget(null);
      setNewPassword("");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function handleSetActive(id: string, isActive: boolean, email: string) {
    if (!isActive) {
      const ok = await confirm({
        title: "Khóa tài khoản",
        description: `Bạn có chắc chắn muốn khóa tài khoản "${email}"? Tài khoản này sẽ bị đăng xuất ngay lập tức.`,
        confirmLabel: "Khóa",
        destructive: true,
      });
      if (!ok) return;
    }

    try {
      await setActive(id, isActive);
      toast.success(isActive ? "Đã mở khóa tài khoản" : "Đã khóa tài khoản");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function handleRemove(id: string, email: string) {
    const ok = await confirm({
      title: "Xóa tài khoản",
      description: `Bạn có chắc chắn muốn xóa tài khoản "${email}"? Không thể hoàn tác.`,
      confirmLabel: "Xóa",
      destructive: true,
    });
    if (!ok) return;

    try {
      await remove(id);
      toast.success("Đã xóa tài khoản");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Tài khoản quản lý</h1>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}>Thêm tài khoản</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thêm tài khoản quản lý</DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="password">Mật khẩu</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Gắn với nhân viên (không bắt buộc)</Label>
                <Select value={employeeId} onValueChange={(v) => setEmployeeId(v as string)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Không gắn nhân viên nào">
                      {(value: string) => {
                        if (value === NONE_EMPLOYEE) return "Không gắn nhân viên nào";
                        const emp = employees.find((x) => x.id === value);
                        return emp ? `${emp.code} — ${emp.fullName}` : "Không gắn nhân viên nào";
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_EMPLOYEE}>Không gắn nhân viên nào</SelectItem>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.code} — {emp.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {formError && <p className="text-sm text-destructive">{formError}</p>}
            </div>

            <DialogFooter>
              <Button onClick={handleCreate}>Tạo</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Vai trò</TableHead>
            <TableHead>Nhân viên</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead className="w-72" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((acc) => (
            <TableRow key={acc.id}>
              <TableCell>{acc.email}</TableCell>
              <TableCell>{acc.role}</TableCell>
              <TableCell>{acc.employee?.fullName ?? "—"}</TableCell>
              <TableCell>
                <Badge variant={acc.isActive ? "default" : "secondary"}>
                  {acc.isActive ? "Đang hoạt động" : "Đã khóa"}
                </Badge>
              </TableCell>
              <TableCell className="flex flex-wrap gap-2">
                {acc.role !== "OWNER" && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetActive(acc.id, !acc.isActive, acc.email)}
                    >
                      {acc.isActive ? "Khóa" : "Mở khóa"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setResetTarget(acc.id)}>
                      Đặt lại mật khẩu
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleRemove(acc.id, acc.email)}>
                      Xóa
                    </Button>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {loading && <p className="text-sm text-muted-foreground">Đang tải...</p>}

      <PaginationBar page={page} total={total} limit={limit} itemLabel="tài khoản" onPageChange={setRequestedPage} />

      <Dialog open={resetTarget !== null} onOpenChange={(v) => !v && setResetTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đặt lại mật khẩu</DialogTitle>
          </DialogHeader>
          <div className="space-y-1">
            <Label htmlFor="newPassword">Mật khẩu mới</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button onClick={handleResetPassword}>Xác nhận</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
