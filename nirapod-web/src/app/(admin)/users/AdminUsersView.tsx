"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Eye,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/axios";
import type { UserRole, UserStatus } from "@/types/user";

interface AdminDocument {
  id: string;
  type: string;
  documentNumber: string | null;
  filePublicId: string;
  verified: boolean;
  createdAt: string;
}

interface AdminUser {
  id: string;
  nid: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  presentAddress: string;
  permanentAddress: string;
  createdAt: string;
  documents: AdminDocument[];
}

interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
}

const STATUS_BADGE: Record<UserStatus, string> = {
  ACTIVE: "bg-green-100 text-green-800 border-green-200",
  PENDING: "bg-amber-100 text-amber-800 border-amber-200",
  SUSPENDED: "bg-red-100 text-red-800 border-red-200",
};

const ROLE_OPTIONS: UserRole[] = ["CITIZEN", "POLICE", "FIRE", "CITY", "ANIMAL", "ADMIN"];
const STATUS_OPTIONS: UserStatus[] = ["PENDING", "ACTIVE", "SUSPENDED"];
const AUTHORITY_ROLES: UserRole[] = ["POLICE", "FIRE", "CITY", "ANIMAL"];

function cloudinaryUrl(publicId: string) {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  return `https://res.cloudinary.com/${cloud}/image/upload/${publicId}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { dateStyle: "medium" });
}

function useUsers(role: UserRole | "", status: UserStatus | "", page: number) {
  return useQuery<Page<AdminUser>>({
    queryKey: ["admin", "users", role, status, page],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, size: 20 };
      if (role) params.role = role;
      if (status) params.status = status;
      const res = await api.get<Page<AdminUser>>("/api/v1/admin/users", { params });
      return res.data;
    },
  });
}

function useApprove() {
  const qc = useQueryClient();
  return useMutation<AdminUser, Error, string>({
    mutationFn: (userId) => api.put(`/api/v1/admin/users/${userId}/approve`).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "users"] }); toast.success("User approved"); },
    onError: () => toast.error("Failed to approve user"),
  });
}

function useSuspend() {
  const qc = useQueryClient();
  return useMutation<AdminUser, Error, string>({
    mutationFn: (userId) => api.put(`/api/v1/admin/users/${userId}/suspend`).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "users"] }); toast.success("User suspended"); },
    onError: () => toast.error("Failed to suspend user"),
  });
}

function useCreateAuthority() {
  const qc = useQueryClient();
  return useMutation<AdminUser, Error, Record<string, string>>({
    mutationFn: (payload) => api.post("/api/v1/admin/users/authority", payload).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "users"] }); toast.success("Authority user created"); },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to create user";
      toast.error(msg);
    },
  });
}

function UserDetailDialog({
  user,
  onClose,
}: {
  user: AdminUser;
  onClose: () => void;
}) {
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{user.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <span className="text-muted-foreground">NID</span><span>{user.nid}</span>
            <span className="text-muted-foreground">Email</span><span>{user.email}</span>
            <span className="text-muted-foreground">Phone</span><span>{user.phone}</span>
            <span className="text-muted-foreground">Role</span><span>{user.role}</span>
            <span className="text-muted-foreground">Status</span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border font-medium w-fit ${STATUS_BADGE[user.status]}`}>{user.status}</span>
            <span className="text-muted-foreground">Present address</span><span>{user.presentAddress}</span>
            <span className="text-muted-foreground">Permanent address</span><span>{user.permanentAddress}</span>
            <span className="text-muted-foreground">Joined</span><span>{formatDate(user.createdAt)}</span>
          </div>
          {user.documents.length > 0 && (
            <div className="space-y-2">
              <p className="font-medium">Documents ({user.documents.length})</p>
              {user.documents.map((doc) => (
                <div key={doc.id} className="rounded border p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-xs">{doc.type}</span>
                    {doc.verified && (
                      <span className="text-xs text-green-700">Verified</span>
                    )}
                  </div>
                  {doc.documentNumber && (
                    <p className="text-muted-foreground text-xs">#{doc.documentNumber}</p>
                  )}
                  <a
                    href={cloudinaryUrl(doc.filePublicId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs underline underline-offset-2 text-blue-600 hover:text-blue-800"
                  >
                    View document
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CreateAuthorityDialog({ onClose }: { onClose: () => void }) {
  const create = useCreateAuthority();
  const [form, setForm] = useState({
    nid: "", email: "", phone: "", name: "", role: "POLICE",
    password: "", presentAddress: "", permanentAddress: "",
  });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    create.mutate(form, { onSuccess: onClose });
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create authority user</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          {(["name", "nid", "email", "phone", "password", "presentAddress", "permanentAddress"] as const).map((field) => (
            <div key={field} className="space-y-1">
              <Label htmlFor={`ca-${field}`} className="text-xs capitalize">
                {field === "nid" ? "NID" : field.replace(/([A-Z])/g, " $1").toLowerCase()}
              </Label>
              <Input
                id={`ca-${field}`}
                type={field === "password" ? "password" : "text"}
                value={form[field]}
                onChange={set(field)}
                required
                minLength={field === "password" ? 8 : undefined}
                className="h-9"
              />
            </div>
          ))}
          <div className="space-y-1">
            <Label htmlFor="ca-role" className="text-xs">Role</Label>
            <select
              id="ca-role"
              value={form.role}
              onChange={set("role")}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              {AUTHORITY_ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={create.isPending}>Create user</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AdminUsersView() {
  const [page, setPage] = useState(0);
  const [roleFilter, setRoleFilter] = useState<UserRole | "">("");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "">("");
  const [viewUser, setViewUser] = useState<AdminUser | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    userId: string; name: string; action: "approve" | "suspend";
  } | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading, isError } = useUsers(roleFilter, statusFilter, page);
  const approve = useApprove();
  const suspend = useSuspend();

  function handleConfirm() {
    if (!confirmAction) return;
    const mutation = confirmAction.action === "approve" ? approve : suspend;
    mutation.mutate(confirmAction.userId, { onSettled: () => setConfirmAction(null) });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-lg font-semibold flex items-center gap-2">
          <Users size={18} aria-hidden="true" />
          Users
          {data && (
            <span className="text-sm font-normal text-muted-foreground">
              ({data.totalElements})
            </span>
          )}
        </h1>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <UserPlus size={14} aria-hidden="true" />
          New authority user
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value as UserRole | ""); setPage(0); }}
          className="h-8 rounded-md border border-input bg-background px-2 text-sm"
          aria-label="Filter by role"
        >
          <option value="">All roles</option>
          {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as UserStatus | ""); setPage(0); }}
          className="h-8 rounded-md border border-input bg-background px-2 text-sm"
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <Separator />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <AlertCircle size={36} className="text-red-500" aria-hidden="true" />
          <p className="text-sm text-red-600">Failed to load users</p>
        </div>
      ) : data?.content.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
          <Users size={36} aria-hidden="true" />
          <p className="text-sm">No users found</p>
        </div>
      ) : (
        <>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground hidden sm:table-cell">Role</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground hidden md:table-cell">Joined</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.content.map((user) => (
                  <tr key={user.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors duration-150">
                    <td className="px-4 py-3">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <Badge variant="outline" className="text-xs">{user.role}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border font-medium ${STATUS_BADGE[user.status]}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewUser(user)}
                          aria-label={`View ${user.name}`}
                        >
                          <Eye size={14} aria-hidden="true" />
                        </Button>
                        {user.status !== "ACTIVE" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmAction({ userId: user.id, name: user.name, action: "approve" })}
                            aria-label={`Approve ${user.name}`}
                            className="text-green-700 hover:text-green-800 hover:bg-green-50"
                          >
                            <CheckCircle size={14} aria-hidden="true" />
                          </Button>
                        )}
                        {user.status !== "SUSPENDED" && user.role !== "ADMIN" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmAction({ userId: user.id, name: user.name, action: "suspend" })}
                            aria-label={`Suspend ${user.name}`}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <XCircle size={14} aria-hidden="true" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(data?.totalPages ?? 0) > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page === 0} aria-label="Previous page">
                <ChevronLeft size={16} aria-hidden="true" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">Page {page + 1} of {data?.totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page + 1 >= (data?.totalPages ?? 1)} aria-label="Next page">
                Next
                <ChevronRight size={16} aria-hidden="true" />
              </Button>
            </div>
          )}
        </>
      )}

      {viewUser && <UserDetailDialog user={viewUser} onClose={() => setViewUser(null)} />}
      {showCreate && <CreateAuthorityDialog onClose={() => setShowCreate(false)} />}

      <Dialog open={!!confirmAction} onOpenChange={(o) => !o && setConfirmAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction?.action === "approve" ? "Approve user" : "Suspend user"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {confirmAction?.action === "approve"
              ? `Approve "${confirmAction?.name}"? They will gain full platform access.`
              : `Suspend "${confirmAction?.name}"? They will lose platform access immediately.`}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAction(null)}>Cancel</Button>
            <Button
              variant={confirmAction?.action === "suspend" ? "destructive" : "default"}
              onClick={handleConfirm}
              disabled={approve.isPending || suspend.isPending}
            >
              {confirmAction?.action === "approve" ? "Approve user" : "Suspend user"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
