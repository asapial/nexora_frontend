"use client";

import { useState, useEffect } from "react";
import {
  RiUserLine, RiAddLine, RiEditLine, RiDeleteBinLine, RiCheckLine,
  RiCloseLine, RiSparklingFill, RiSearchLine, RiMoreLine,
  RiShieldLine, RiLockPasswordLine, RiEyeLine, RiAlertLine,
  RiUserFollowLine, RiUserForbidLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";

type Role   = "STUDENT" | "TEACHER" | "ADMIN";
interface User {
  id: string; name: string; email: string; role: Role;
  isActive: boolean; emailVerified: boolean;
  createdAt: string; lastLoginAt?: string; image?: string;
}

const API = (p: string) => `/api/admin/users${p}`;
const apiFetch = (url: string, opts?: RequestInit) =>
  fetch(url, { credentials: "include", headers: { "Content-Type": "application/json" }, ...opts }).then(r => r.json());

const ROLE_BADGE: Record<Role, string> = {
  STUDENT: "bg-sky-100/80 dark:bg-sky-950/50 text-sky-700 dark:text-sky-400 border-sky-200/70 dark:border-sky-800/50",
  TEACHER: "bg-teal-100/80 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400 border-teal-200/70 dark:border-teal-800/50",
  ADMIN:   "bg-violet-100/80 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 border-violet-200/70 dark:border-violet-800/50",
};

const initials = (name: string) => name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

// ─── Create user modal ────────────────────────────────────
function CreateUserModal({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "STUDENT" as Role });
  const [errors, setErrors]   = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim())          e.name     = "Name is required";
    if (!form.email.trim())         e.email    = "Email is required";
    if (form.password.length < 8)   e.password = "Password must be at least 8 characters";
    return e;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    await apiFetch(API("/"), { method: "POST", body: JSON.stringify(form) });
    setLoading(false); onDone();
  };

  const inp = (field: keyof typeof form) => (v: string) => { setForm(p => ({ ...p, [field]: v })); setErrors(e => ({ ...e, [field]: "" })); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <span className="text-[14.5px] font-bold text-foreground">Create User</span>
          <button onClick={onDone} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60"><RiCloseLine /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {[
            { label: "Full name", field: "name", placeholder: "Dr. Riya Mehta", type: "text" },
            { label: "Email",     field: "email",    placeholder: "riya@example.com", type: "email" },
            { label: "Password",  field: "password", placeholder: "Min. 8 characters", type: "password" },
          ].map(({ label, field, placeholder, type }) => (
            <div key={field} className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-foreground/80">{label}</label>
              <input type={type} value={form[field as keyof typeof form] as string} onChange={e => inp(field as keyof typeof form)(e.target.value)} placeholder={placeholder}
                className={cn("w-full h-10 px-4 rounded-xl text-[13.5px] bg-muted/40 border",
                  errors[field] ? "border-red-400/60" : "border-border focus:border-teal-400/70",
                  "text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-teal-400/20 transition-all")} />
              {errors[field] && <p className="text-[12px] text-red-500 font-medium">{errors[field]}</p>}
            </div>
          ))}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-foreground/80">Role</label>
            <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value as Role }))}
              className="w-full h-10 px-4 rounded-xl text-[13.5px] bg-muted/40 border border-border text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-400/20 transition-all">
              <option value="STUDENT">Student</option>
              <option value="TEACHER">Teacher</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className="flex gap-3 justify-end pt-2 border-t border-border">
            <button type="button" onClick={onDone} className="h-9 px-4 rounded-xl border border-border text-[13px] font-semibold text-muted-foreground hover:bg-muted/50 transition-all">Cancel</button>
            <button type="submit" disabled={loading}
              className="inline-flex items-center gap-2 h-9 px-5 rounded-xl bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 text-white text-[13px] font-bold shadow-sm shadow-teal-600/20 transition-all disabled:opacity-60">
              {loading ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <RiCheckLine />} Create user
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Reset password modal ─────────────────────────────────
function ResetPasswordModal({ user, onDone }: { user: User; onDone: () => void }) {
  const [pw, setPw]         = useState("");
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone]     = useState(false);

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (pw.length < 8) { setError("Minimum 8 characters"); return; }
    setLoading(true);
    await apiFetch(API(`/${user.id}/reset-password`), { method: "PATCH", body: JSON.stringify({ newPassword: pw }) });
    setLoading(false); setDone(true);
    setTimeout(onDone, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <span className="text-[14.5px] font-bold text-foreground">Reset Password</span>
          <button onClick={onDone} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60"><RiCloseLine /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <p className="text-[13px] text-muted-foreground">Set a new password for <strong className="text-foreground">{user.name}</strong>. They will be required to change it on next login.</p>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-foreground/80">New password</label>
            <input type="password" value={pw} onChange={e => { setPw(e.target.value); setError(""); }} placeholder="Min. 8 characters"
              className={cn("w-full h-10 px-4 rounded-xl text-[13.5px] bg-muted/40 border",
                error ? "border-red-400/60" : "border-border focus:border-teal-400/70",
                "text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-teal-400/20 transition-all")} />
            {error && <p className="text-[12px] text-red-500 font-medium">{error}</p>}
          </div>
          <div className="flex gap-3 justify-end border-t border-border pt-3">
            <button type="button" onClick={onDone} className="h-9 px-4 rounded-xl border border-border text-[13px] font-semibold text-muted-foreground hover:bg-muted/50 transition-all">Cancel</button>
            <button type="submit" disabled={loading || done}
              className="inline-flex items-center gap-2 h-9 px-5 rounded-xl bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 text-white text-[13px] font-bold shadow-sm shadow-teal-600/20 transition-all disabled:opacity-60">
              {done ? <><RiCheckLine />Done</> : loading ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><RiLockPasswordLine />Reset</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Impersonate modal ────────────────────────────────────
function ImpersonateModal({ user, onDone }: { user: User; onDone: () => void }) {
  const [reason,  setReason]  = useState("");
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (reason.length < 5) { setError("Provide a reason (min 5 chars)"); return; }
    setLoading(true);
    const data = await apiFetch(API(`/${user.id}/impersonate`), { method: "POST", body: JSON.stringify({ reason }) });
    if (data.success) {
      // In production: set tokens in cookies and redirect to dashboard
      alert(`Impersonation token issued for ${user.name}.\nIn production this would set the session cookies and redirect.`);
    }
    setLoading(false); onDone();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-amber-300/50 dark:border-amber-700/50 bg-card shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-amber-50/30 dark:bg-amber-950/10">
          <RiEyeLine className="text-amber-600 dark:text-amber-400" />
          <span className="text-[14px] font-bold text-foreground">Impersonate User</span>
        </div>
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/50">
            <RiAlertLine className="text-amber-500 dark:text-amber-400 text-base mt-0.5 flex-shrink-0" />
            <p className="text-[12.5px] text-amber-700 dark:text-amber-400">This action is logged in the audit trail. You will temporarily act as <strong>{user.name}</strong>.</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-foreground/80">Reason <span className="text-red-500">*</span></label>
            <input value={reason} onChange={e => { setReason(e.target.value); setError(""); }} placeholder="e.g. Debugging enrollment issue reported by user"
              className={cn("w-full h-10 px-4 rounded-xl text-[13.5px] bg-muted/40 border",
                error ? "border-red-400/60" : "border-border focus:border-amber-400/70",
                "text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-amber-400/20 transition-all")} />
            {error && <p className="text-[12px] text-red-500 font-medium">{error}</p>}
          </div>
          <div className="flex gap-3 justify-end border-t border-border pt-3">
            <button type="button" onClick={onDone} className="h-9 px-4 rounded-xl border border-border text-[13px] font-semibold text-muted-foreground hover:bg-muted/50 transition-all">Cancel</button>
            <button type="submit" disabled={loading}
              className="inline-flex items-center gap-2 h-9 px-5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[13px] font-bold transition-all disabled:opacity-60">
              {loading ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <RiEyeLine />} Impersonate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── User row menu ─────────────────────────────────────────
function UserRowMenu({ user, onRefresh }: { user: User; onRefresh: () => void }) {
  const [menuOpen,        setMenuOpen]        = useState(false);
  const [showReset,       setShowReset]       = useState(false);
  const [showImpersonate, setShowImpersonate] = useState(false);

  const toggle = async (action: "deactivate" | "activate" | "delete") => {
    const methodMap = { deactivate: "PATCH", activate: "PATCH", delete: "DELETE" };
    await apiFetch(API(`/${user.id}${action === "delete" ? "" : `/${action}`}`), { method: methodMap[action] });
    setMenuOpen(false); onRefresh();
  };

  return (
    <>
      {showReset       && <ResetPasswordModal user={user} onDone={() => { setShowReset(false); }} />}
      {showImpersonate && <ImpersonateModal   user={user} onDone={() => { setShowImpersonate(false); }} />}

      <div className="relative">
        <button onClick={() => setMenuOpen(o => !o)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-muted/60 transition-all"><RiMoreLine /></button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-full mt-1 z-20 w-48 rounded-xl border border-border bg-popover shadow-xl overflow-hidden">
              <button onClick={() => { setShowReset(true); setMenuOpen(false); }} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[13px] text-foreground hover:bg-accent transition-colors"><RiLockPasswordLine className="text-muted-foreground"/>Reset password</button>
              <button onClick={() => { setShowImpersonate(true); setMenuOpen(false); }} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[13px] text-foreground hover:bg-accent transition-colors"><RiEyeLine className="text-muted-foreground"/>Impersonate</button>
              <div className="border-t border-border" />
              {user.isActive
                ? <button onClick={() => toggle("deactivate")} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[13px] text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"><RiUserForbidLine />Deactivate</button>
                : <button onClick={() => toggle("activate")}   className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[13px] text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/30 transition-colors"><RiUserFollowLine />Activate</button>
              }
              <button onClick={() => toggle("delete")} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[13px] text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"><RiDeleteBinLine />Delete user</button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────
export default function AdminUserManagementPage() {
  const [users,     setUsers]     = useState<User[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [roleFilter,setRoleFilter]= useState("");
  const [showCreate,setShowCreate]= useState(false);
  const [page,      setPage]      = useState(1);
  const [totalPages,setTotalPages]= useState(1);

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "25" });
    if (search)     params.set("search", search);
    if (roleFilter) params.set("role", roleFilter);
    const data = await apiFetch(API(`?${params}`));
    if (data.success) { setUsers(data.data.users); setTotalPages(data.data.totalPages); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [search, roleFilter, page]);

  return (
    <div className="flex flex-col gap-6 p-5 lg:p-7 pt-6 max-w-6xl mx-auto w-full">
      {showCreate && <CreateUserModal onDone={() => { setShowCreate(false); load(); }} />}

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-1.5 mb-1"><RiSparklingFill className="text-teal-500 dark:text-teal-400 text-sm animate-pulse" /><span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">Admin</span></div>
          <h1 className="text-[1.5rem] font-extrabold tracking-tight text-foreground leading-none">User Management</h1>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 text-white text-[13.5px] font-bold shadow-md shadow-teal-600/20 transition-all hover:scale-[1.02]">
          <RiAddLine /> New user
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search by name or email…"
            className="w-full h-10 pl-9 pr-4 rounded-xl text-[13.5px] bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70 transition-all" />
        </div>
        <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
          className="h-10 px-4 rounded-xl text-[13.5px] bg-muted/40 border border-border text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-400/20 transition-all">
          <option value="">All roles</option>
          <option value="STUDENT">Students</option>
          <option value="TEACHER">Teachers</option>
          <option value="ADMIN">Admins</option>
        </select>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><span className="w-6 h-6 border-2 border-teal-200 dark:border-teal-800 border-t-teal-500 rounded-full animate-spin" /></div>
        ) : (
          <div className="flex flex-col divide-y divide-border/60">
            {users.map(u => (
              <div key={u.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/20 transition-colors">
                <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-[12px] bg-teal-600/15 dark:bg-teal-400/12 text-teal-700 dark:text-teal-300 border border-teal-300/50 dark:border-teal-600/30">
                  {u.image ? <img src={u.image} alt="" className="w-full h-full rounded-full object-cover" /> : initials(u.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-[13.5px] font-bold text-foreground">{u.name}</span>
                    <span className={cn("text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border", ROLE_BADGE[u.role])}>{u.role}</span>
                    {!u.isActive && <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border bg-red-100/80 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200/70 dark:border-red-800/50">Inactive</span>}
                    {!u.emailVerified && <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border bg-amber-100/80 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200/70 dark:border-amber-800/50">Unverified</span>}
                  </div>
                  <p className="text-[12px] text-muted-foreground truncate">{u.email}</p>
                </div>
                <div className="text-right flex-shrink-0 hidden sm:block">
                  <p className="text-[12px] text-muted-foreground">Joined {new Date(u.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                  {u.lastLoginAt && <p className="text-[11px] text-muted-foreground/60">Last login {new Date(u.lastLoginAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</p>}
                </div>
                <UserRowMenu user={u} onRefresh={load} />
              </div>
            ))}
            {users.length === 0 && <div className="px-5 py-12 text-center"><RiUserLine className="text-3xl text-muted-foreground/25 mx-auto mb-2" /><p className="text-[13.5px] text-muted-foreground">No users found</p></div>}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="h-9 px-4 rounded-xl border border-border text-[13px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed">Previous</button>
          <span className="text-[13px] text-muted-foreground">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="h-9 px-4 rounded-xl border border-border text-[13px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
        </div>
      )}
    </div>
  );
}