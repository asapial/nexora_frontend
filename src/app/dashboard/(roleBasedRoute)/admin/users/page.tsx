"use client";

import { useCallback, useEffect, useState } from "react";
import {
  RiSparklingFill, RiSearchLine, RiRefreshLine, RiUserLine,
  RiShieldUserLine, RiUserStarLine, RiMoreLine, RiEditLine,
  RiDeleteBinLine, RiLockPasswordLine, RiEyeLine, RiLoader4Line,
  RiCheckLine, RiCloseLine, RiAddLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import { adminUsersApi } from "@/lib/api";
import { toast } from "sonner";

const ROLE_CFG: Record<string, { label: string; cls: string }> = {
  ADMIN:   { label: "Admin",   cls: "text-violet-700 dark:text-violet-400 bg-violet-50/80 dark:bg-violet-950/40 border-violet-200/60 dark:border-violet-800/50" },
  TEACHER: { label: "Teacher", cls: "text-teal-700 dark:text-teal-400 bg-teal-50/80 dark:bg-teal-950/40 border-teal-200/60 dark:border-teal-800/50" },
  STUDENT: { label: "Student", cls: "text-sky-700 dark:text-sky-400 bg-sky-50/80 dark:bg-sky-950/40 border-sky-200/60 dark:border-sky-800/50" },
};

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  image?: string;
  createdAt: string;
  emailVerified: boolean;
  needPasswordChange: boolean;
  isDeleted: boolean;
};

type RoleFilter = "all" | "ADMIN" | "TEACHER" | "STUDENT";

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

function SkeletonRow() {
  return (
    <div className="grid grid-cols-[1fr_180px_100px_120px_80px] gap-4 px-5 py-4 border-b border-border/60 animate-pulse items-center">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-muted shrink-0" />
        <div className="space-y-1.5">
          <div className="h-3 bg-muted rounded w-32" />
          <div className="h-2.5 bg-muted rounded w-44" />
        </div>
      </div>
      <div className="h-3 bg-muted rounded w-24" />
      <div className="h-5 bg-muted rounded-full w-16" />
      <div className="h-3 bg-muted rounded w-16" />
      <div className="flex gap-1">
        <div className="w-6 h-6 bg-muted rounded-lg" />
        <div className="w-6 h-6 bg-muted rounded-lg" />
      </div>
    </div>
  );
}

// ─── Edit Modal ───────────────────────────────────────────
function EditModal({
  user,
  onClose,
  onSave,
}: {
  user: User;
  onClose: () => void;
  onSave: (id: string, data: any) => Promise<void>;
}) {
  const [name, setName] = useState(user.name);
  const [role, setRole] = useState(user.role);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await onSave(user.id, { name, role });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="rounded-2xl border border-border bg-card shadow-2xl w-full max-w-md p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-extrabold text-foreground">Edit User</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted/60 transition-all">
            <RiCloseLine />
          </button>
        </div>
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-[12px] font-semibold text-muted-foreground mb-1 block">Name</label>
            <input value={name} onChange={e => setName(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-border bg-muted/30 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-teal-400/25 transition-all" />
          </div>
          <div>
            <label className="text-[12px] font-semibold text-muted-foreground mb-1 block">Role</label>
            <div className="grid grid-cols-3 gap-2">
              {["STUDENT", "TEACHER", "ADMIN"].map(r => (
                <button key={r} onClick={() => setRole(r)}
                  className={cn("h-9 rounded-xl text-[12px] font-semibold border transition-all",
                    role === r ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:bg-muted/40")}>
                  {r.charAt(0) + r.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
        <button onClick={save} disabled={saving || !name.trim()}
          className="h-11 rounded-xl bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 disabled:opacity-50 text-white text-[13px] font-bold flex items-center justify-center gap-2 transition-all">
          {saving ? <RiLoader4Line className="animate-spin" /> : <RiCheckLine />}
          Save changes
        </button>
      </div>
    </div>
  );
}

// ─── Action Menu ──────────────────────────────────────────
function ActionMenu({
  user,
  onEdit,
  onDeactivate,
  onResetPwd,
  onImpersonate,
}: {
  user: User;
  onEdit: () => void;
  onDeactivate: () => void;
  onResetPwd: () => void;
  onImpersonate: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button onClick={() => setOpen(v => !v)}
        className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all">
        <RiMoreLine className="text-sm" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 w-44 rounded-xl border border-border bg-card shadow-xl overflow-hidden">
            {[
              { icon: <RiEditLine />, label: "Edit user", fn: onEdit },
              { icon: <RiLockPasswordLine />, label: "Reset password", fn: onResetPwd },
              { icon: <RiEyeLine />, label: "Impersonate", fn: onImpersonate },
              { icon: <RiDeleteBinLine />, label: "Deactivate", fn: onDeactivate, danger: true },
            ].map(a => (
              <button key={a.label} onClick={() => { a.fn(); setOpen(false); }}
                className={cn("w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12.5px] font-medium transition-colors hover:bg-muted/40",
                  a.danger ? "text-rose-600 dark:text-rose-400" : "text-foreground")}>
                <span className="text-sm">{a.icon}</span>
                {a.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminUserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: LIMIT };
      if (roleFilter !== "all") params.role = roleFilter;
      if (search.trim()) params.search = search.trim();
      const r = await adminUsersApi.getUsers(params);
      const d = r.data;
      setUsers(Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : []);
      setTotal(d?.total ?? 0);
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : "Failed"); }
    finally { setLoading(false); }
  }, [page, roleFilter, search]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (id: string, data: any) => {
    await adminUsersApi.updateUser(id, data);
    toast.success("User updated");
    load();
  };

  const handleDeactivate = async (u: User) => {
    if (!confirm(`Deactivate ${u.name}?`)) return;
    try {
      await adminUsersApi.deactivate(u.id);
      toast.success("User deactivated");
      load();
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : "Failed"); }
  };

  const handleResetPwd = async (u: User) => {
    if (!confirm(`Send password reset to ${u.email}?`)) return;
    try {
      await adminUsersApi.resetPwd(u.id);
      toast.success(`Reset email sent to ${u.email}`);
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : "Failed"); }
  };

  const handleImpersonate = async (u: User) => {
    try {
      await adminUsersApi.impersonate(u.id);
      toast.success(`Impersonation logged for ${u.email}`);
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : "Failed"); }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="flex flex-col gap-6 p-5 lg:p-7 pt-6 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <RiSparklingFill className="text-teal-500 dark:text-teal-400 text-sm animate-pulse" />
          <span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">Admin</span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[1.5rem] font-extrabold tracking-tight text-foreground leading-none">User Management</h1>
            <p className="text-[13px] text-muted-foreground mt-1">View, edit, manage roles, reset passwords and impersonate users</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={load}
              className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all">
              <RiRefreshLine className={cn("text-sm", loading && "animate-spin")} />
            </button>
            <a href="/dashboard/admin/create"
              className="h-9 px-4 rounded-xl bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 text-white text-[12.5px] font-bold flex items-center gap-1.5 transition-all">
              <RiAddLine /> Create users
            </a>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: <RiUserLine />, label: "Total Users", val: total, col: "text-teal-600 dark:text-teal-400 bg-teal-100/60 dark:bg-teal-950/40 border-teal-200/60" },
          { icon: <RiUserStarLine />, label: "Admins", val: users.filter(u => u.role === "ADMIN").length, col: "text-teal-600 dark:text-teal-400 bg-teal-100/60 dark:bg-teal-950/40 border-teal-200/60" },
          { icon: <RiShieldUserLine />, label: "Teachers", val: users.filter(u => u.role === "TEACHER").length, col: "text-amber-600 dark:text-amber-400 bg-amber-100/60 dark:bg-amber-950/40 border-amber-200/60" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-4">
            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center text-sm border mb-2.5", s.col)}>{s.icon}</div>
            <p className="text-[1.3rem] font-extrabold tabular-nums text-foreground leading-none mb-0.5">{loading ? "—" : s.val}</p>
            <p className="text-[12px] font-medium text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none text-sm" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search name or email…"
            className="w-full h-10 pl-9 pr-4 rounded-xl text-[13px] bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-teal-400/20 transition-all" />
        </div>
        <div className="flex items-center gap-2">
          {(["all", "ADMIN", "TEACHER", "STUDENT"] as RoleFilter[]).map(f => (
            <button key={f} onClick={() => { setRoleFilter(f); setPage(1); }}
              className={cn("h-9 px-3 rounded-xl text-[12px] font-semibold border transition-all",
                roleFilter === f ? "bg-teal-600 text-white border-teal-600" : "border-border text-muted-foreground hover:bg-muted/40")}>
              {f === "all" ? "All" : f.charAt(0) + f.slice(1).toLowerCase() + "s"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-[1fr_180px_100px_120px_80px] gap-4 px-5 py-3 border-b border-border bg-muted/20">
          {["User", "Joined", "Role", "Status", "Actions"].map(h => (
            <p key={h} className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{h}</p>
          ))}
        </div>

        {loading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
          : users.length === 0
          ? (
            <div className="py-16 text-center">
              <RiUserLine className="text-4xl text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-[13.5px] font-medium text-muted-foreground">No users found</p>
            </div>
          )
          : users.map(u => {
            const roleCfg = ROLE_CFG[u.role] ?? { label: u.role, cls: "border-border text-muted-foreground" };
            return (
              <div key={u.id} className="grid grid-cols-[1fr_180px_100px_120px_80px] gap-4 px-5 py-4 border-b border-border/60 last:border-0 hover:bg-muted/10 transition-colors items-center">
                <div className="flex items-center gap-3 min-w-0">
                  {u.image ? (
                    <img src={u.image} alt={u.name} className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-border" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <RiUserLine className="text-muted-foreground text-xs" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-foreground truncate">{u.name}</p>
                    <p className="text-[11.5px] text-muted-foreground truncate">{u.email}</p>
                  </div>
                </div>
                <p className="text-[12.5px] text-muted-foreground">{fmtDate(u.createdAt)}</p>
                <span className={cn("text-[10.5px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full border w-fit", roleCfg.cls)}>
                  {roleCfg.label}
                </span>
                <span className={cn("text-[10.5px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full border w-fit",
                  u.isDeleted
                    ? "text-rose-600 bg-rose-50/70 dark:bg-rose-950/30 border-rose-200/60"
                    : u.needPasswordChange
                    ? "text-amber-600 bg-amber-50/70 dark:bg-amber-950/30 border-amber-200/60"
                    : "text-teal-600 bg-teal-50/70 dark:bg-teal-950/30 border-teal-200/60"
                )}>
                  {u.isDeleted ? "Inactive" : u.needPasswordChange ? "Pending" : "Active"}
                </span>
                <ActionMenu user={u}
                  onEdit={() => setEditingUser(u)}
                  onDeactivate={() => handleDeactivate(u)}
                  onResetPwd={() => handleResetPwd(u)}
                  onImpersonate={() => handleImpersonate(u)}
                />
              </div>
            );
          })}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="h-8 px-3 rounded-xl border border-border text-[12.5px] font-semibold text-muted-foreground hover:bg-muted/40 disabled:opacity-40 transition-all">
            Previous
          </button>
          <span className="text-[12.5px] text-muted-foreground">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="h-8 px-3 rounded-xl border border-border text-[12.5px] font-semibold text-muted-foreground hover:bg-muted/40 disabled:opacity-40 transition-all">
            Next
          </button>
        </div>
      )}

      {editingUser && (
        <EditModal user={editingUser} onClose={() => setEditingUser(null)} onSave={handleSave} />
      )}
    </div>
  );
}