"use client";

import { useEffect, useRef, useState } from "react";
import {
  RiBookOpenLine, RiMenuLine, RiGroupLine, RiCalendarLine,
  RiFileTextLine, RiGraduationCapLine, RiBarChartLine,
  RiQuestionLine, RiMailLine, RiShieldCheckLine, RiFileListLine,
  RiArrowRightLine, RiLogoutBoxLine, RiLockPasswordLine,
  RiMailCheckLine, RiAdminLine, RiUserLine, RiCheckLine,
  RiAlertLine, RiLoader4Line, RiDashboardLine,
} from "react-icons/ri";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu, NavigationMenuContent, NavigationMenuItem,
  NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { ModeToggle } from "./themeToggleSwitch";
import Link from "next/link";


// ─────────────────────────────────────────────────────────
// TYPES  (exported so the layout can import them)
// ─────────────────────────────────────────────────────────
export type Role = "ADMIN" | "TEACHER" | "STUDENT";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: Role;
  emailVerified: boolean;
}

export interface MenuItem {
  title: string;
  url: string;
  description?: string;
  icon?: React.ReactNode;
  items?: MenuItem[];
}

export interface NavBarProps {
  className?: string;
  logo?: { url: string; src: string; alt: string; title: string };
  menu?: MenuItem[];
  auth?: {
    login:  { title: string; url: string };
    signup: { title: string; url: string };
  };
  /**
   * Authenticated user — managed by the parent layout, NOT fetched here.
   * Pass `null` or omit while logged out.
   */
  user?: AuthUser | null;
  /**
   * Show a skeleton avatar while the parent is loading the session.
   * Prevents the auth buttons flickering in before the real state arrives.
   */
  isLoadingUser?: boolean;
  onSignOut?: () => Promise<void> | void;
  onChangePassword?: () => void;
  onVerifyEmail?: () => Promise<void> | void;
}

// ─────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────
const ROLE_CFG: Record<Role, { label: string; icon: React.ReactNode; badge: string }> = {
  ADMIN:   { label: "Admin",   icon: <RiAdminLine className="text-xs" />,         badge: "bg-violet-100/80 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border-violet-200/70 dark:border-violet-800/50" },
  TEACHER: { label: "Teacher", icon: <RiGraduationCapLine className="text-xs" />, badge: "bg-teal-100/80 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border-teal-200/70 dark:border-teal-800/50" },
  STUDENT: { label: "Student", icon: <RiUserLine className="text-xs" />,          badge: "bg-blue-100/80 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200/70 dark:border-blue-800/50" },
};

const DASHBOARD_ROUTE: Record<Role, string> = {
  ADMIN:   "/dashboard",
  TEACHER: "/dashboard",
  STUDENT: "/dashboard",
};

const DEFAULT_MENU: MenuItem[] = [
  { title: "Home", url: "/" },
  { title: "Courses", url: "/courses" },
  {
    title: "Dashboard", url: "/dashboard",
    // items: [
    //   { title: "Clusters",  description: "Create and manage learning groups with full member control", icon: <RiGroupLine className="size-5 shrink-0" />,        url: "/dashboard/student/cluster"  },
    //   { title: "Sessions",  description: "Schedule sessions and auto-generate tasks for every member", icon: <RiCalendarLine className="size-5 shrink-0" />,      url: "#sessions"  },
    //   { title: "Resources", description: "Upload, organize, and share papers, slides, and files",      icon: <RiFileTextLine className="size-5 shrink-0" />,      url: "#resources" },
    //   { title: "Courses",   description: "Structured learning paths with certificates and payments",   icon: <RiGraduationCapLine className="size-5 shrink-0" />, url: "#courses"   },
    //   { title: "Analytics", description: "Track member progress, scores, and cluster health scores",   icon: <RiBarChartLine className="size-5 shrink-0" />,      url: "#analytics" },
    // ],
  },
  // {
  //   title: "Resources", url: "#",
  //   items: [
  //     { title: "Documentation", description: "Guides, API reference, and integration docs",        icon: <RiBookOpenLine className="size-5 shrink-0" />,    url: "#docs"    },
  //     { title: "Help Center",   description: "Answers to the most common questions",                icon: <RiQuestionLine className="size-5 shrink-0" />,    url: "#help"    },
  //     { title: "Contact Us",    description: "Reach our team — we respond within 24 hours",         icon: <RiMailLine className="size-5 shrink-0" />,       url: "#contact" },
  //     { title: "Terms",         description: "Our terms and conditions for using Nexora",           icon: <RiFileListLine className="size-5 shrink-0" />,    url: "#terms"   },
  //     { title: "Privacy",       description: "How we collect, store, and protect your data",        icon: <RiShieldCheckLine className="size-5 shrink-0" />, url: "#privacy" },
  //   ],
  // },
  // { title: "Pricing", url: "#pricing" },
  // { title: "Blog",    url: "#blog"    },
];

// ─────────────────────────────────────────────────────────
// SMALL SHARED COMPONENTS
// ─────────────────────────────────────────────────────────
function UserAvatar({
  user,
  size = "sm",
}: {
  user: AuthUser;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? 32 : 40; // px
  const textSize = size === "sm" ? "text-[13px]" : "text-[15px]";

  return (
    <div
      className="relative flex-shrink-0"
      style={{ width: dim, height: dim }}
    >

      <div className="absolute inset-0 rounded-full bg-teal-500/30 blur-md scale-110" />


      <div className="relative w-full h-full rounded-full p-[2px] bg-gradient-to-br from-teal-400 to-teal-600">
        <div className="w-full h-full rounded-full overflow-hidden bg-background flex items-center justify-center">
          
          {user.image ? (
            <img
              src={user.image}
              alt={user.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className={cn("text-white font-extrabold", textSize)}>
              {user.name.charAt(0).toUpperCase()}
            </span>
          )}

        </div>
      </div>


      <span
        className="
          absolute 
          bottom-0 right-0 
          translate-x-1/4 translate-y-1/4
          w-3 h-3
          rounded-full 
          bg-green-500
          border-2 border-background
          shadow-md
        "
      />
    </div>
  );
}

/** Placeholder while the parent is loading the session */
function AvatarSkeleton() {
  return <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 animate-pulse" />;
}

function SubMenuLink({ item, mobile = false }: { item: MenuItem; mobile?: boolean }) {
  return (
    <a href={item.url} className={cn(
      "flex flex-row items-start gap-3 rounded-lg p-2.5 no-underline outline-none select-none transition-colors duration-150 group",
      mobile ? "hover:bg-zinc-50 dark:hover:bg-zinc-900" : "hover:bg-zinc-50/80 dark:hover:bg-zinc-800/60",
    )}>
      <div className={cn(
        "flex items-center justify-center rounded-md shrink-0 w-9 h-9",
        "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400",
        "group-hover:bg-teal-50 dark:group-hover:bg-teal-950/60 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors duration-150",
      )}>{item.icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold leading-none mb-1 text-zinc-800 dark:text-zinc-200 group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors duration-150">{item.title}</div>
        {item.description && <p className="text-xs leading-snug text-zinc-500 dark:text-zinc-500 line-clamp-2">{item.description}</p>}
      </div>
    </a>
  );
}

function LogoMark({ title }: { title: string }) {
  return (
    <Link href="/" className="flex gap-2">
      <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center select-none">
        <div className="absolute inset-0 rounded-[10px] bg-teal-400/20 blur-[6px] opacity-70" />
        <div className="relative flex h-8 w-8 items-center justify-center rounded-[10px] bg-gradient-to-br from-teal-400/20 via-teal-500/10 to-emerald-500/15 dark:from-teal-400/15 dark:via-teal-500/8 dark:to-emerald-500/10 border border-teal-400/30 dark:border-teal-400/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] text-[17px] text-teal-500 dark:text-teal-400">⬡</div>
      </div>
      <div className="flex flex-col justify-center min-w-0">
        <span className="text-2xl font-black tracking-[-0.02em] leading-none bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-500 dark:from-teal-300 dark:via-teal-400 dark:to-emerald-400 bg-clip-text text-transparent" style={{ fontVariantLigatures: "none" }}>{title}</span>
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────
// ACCOUNT DROPDOWN
// ─────────────────────────────────────────────────────────
function AccountDropdown({ user, onSignOut, onChangePassword, onVerifyEmail, onClose }: {
  user: AuthUser;
  onSignOut?: () => Promise<void> | void;
  onChangePassword?: () => void;
  onVerifyEmail?: () => Promise<void> | void;
  onClose: () => void;
}) {
  const [signingOut,    setSigningOut]    = useState(false);
  const [sendingVerify, setSendingVerify] = useState(false);
  const [verifyDone,    setVerifyDone]    = useState(false);
  const cfg = ROLE_CFG[user.role];

  const handleSignOut = async () => {
    setSigningOut(true);
    try { await onSignOut?.(); } finally { setSigningOut(false); onClose(); }
  };

  const handleVerify = async () => {
    setSendingVerify(true);
    try { await onVerifyEmail?.(); setVerifyDone(true); }
    finally { setSendingVerify(false); }
  };

  return (
    <div className={cn(
      "absolute right-0 top-[calc(100%+8px)] z-50 w-72 rounded-2xl overflow-hidden",
      "bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl",
      "border border-zinc-200/80 dark:border-zinc-800/80",
      "shadow-xl shadow-zinc-900/10 dark:shadow-zinc-900/50",
      "animate-in fade-in slide-in-from-top-2 duration-150",
    )}>
      {/* ── Identity ── */}
      <div className="px-4 py-4 border-b border-zinc-100 dark:border-zinc-800/80">
        <div className="flex items-center gap-3">
          <UserAvatar user={user} size="md" />
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-extrabold text-zinc-900 dark:text-zinc-50 truncate">{user.name}</p>
            <p className="text-[11.5px] text-zinc-500 dark:text-zinc-400 truncate">{user.email}</p>
            <span className={cn("mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10.5px] font-bold", cfg.badge)}>
              {cfg.icon} {cfg.label}
            </span>
          </div>
        </div>
      </div>

      {/* ── Email verification ── */}
      {!user.emailVerified ? (
        <div className="mx-3 mt-3 px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/50">
          <div className="flex items-center gap-2 mb-2">
            <RiAlertLine className="text-amber-500 text-sm flex-shrink-0" />
            <p className="text-[12px] font-bold text-amber-700 dark:text-amber-300">Email not verified</p>
          </div>
          <p className="text-[11.5px] text-amber-600 dark:text-amber-400 leading-snug mb-2.5">
            Verify your email to unlock all features.
          </p>
          <button
            onClick={handleVerify}
            disabled={sendingVerify || verifyDone}
            className={cn(
              "w-full h-8 rounded-lg text-[12px] font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-60",
              verifyDone
                ? "bg-teal-100 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 cursor-default"
                : "bg-amber-500 hover:bg-amber-600 text-white",
            )}
          >
            {sendingVerify ? <><RiLoader4Line className="animate-spin text-xs" />Sending…</>
              : verifyDone  ? <><RiCheckLine className="text-xs" />Email sent!</>
              : <><RiMailCheckLine className="text-xs" />Resend verification email</>}
          </button>
        </div>
      ) : (
        <div className="mx-3 mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-teal-50/70 dark:bg-teal-950/20 border border-teal-200/60 dark:border-teal-800/40">
          <RiMailCheckLine className="text-teal-500 text-sm flex-shrink-0" />
          <p className="text-[11.5px] font-semibold text-teal-700 dark:text-teal-300">Email verified</p>
        </div>
      )}

      {/* ── Navigation links ── */}
      <div className="px-3 mt-3 flex flex-col gap-0.5">
        <Link href={DASHBOARD_ROUTE[user.role]} onClick={onClose} className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors group",
          "text-[13px] font-semibold text-zinc-700 dark:text-zinc-300",
          "hover:bg-zinc-50 dark:hover:bg-zinc-800/60 hover:text-teal-700 dark:hover:text-teal-300",
        )}>
          <span className="w-7 h-7 rounded-lg flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 group-hover:bg-teal-50 dark:group-hover:bg-teal-950/50 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors text-sm flex-shrink-0"><RiDashboardLine /></span>
          Go to Dashboard
        </Link>

        <button onClick={() => { onChangePassword?.(); onClose(); }} className={cn(
          "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left transition-colors group",
          "text-[13px] font-semibold text-zinc-700 dark:text-zinc-300",
          "hover:bg-zinc-50 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-zinc-50",
        )}>
          <span className="w-7 h-7 rounded-lg flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 group-hover:bg-zinc-200/80 dark:group-hover:bg-zinc-700 transition-colors text-sm flex-shrink-0"><RiLockPasswordLine /></span>
          Change password
        </button>
      </div>

      {/* ── Sign out ── */}
      <div className="border-t border-zinc-100 dark:border-zinc-800 px-3 py-3 mt-1">
        <button onClick={handleSignOut} disabled={signingOut} className={cn(
          "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left transition-colors group disabled:opacity-60",
          "text-[13px] font-semibold text-red-600 dark:text-red-400",
          "hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-700 dark:hover:text-red-300",
        )}>
          <span className="w-7 h-7 rounded-lg flex items-center justify-center bg-red-50 dark:bg-red-950/30 text-red-500 dark:text-red-400 group-hover:bg-red-100 dark:group-hover:bg-red-950/50 transition-colors text-sm flex-shrink-0">
            {signingOut ? <RiLoader4Line className="animate-spin" /> : <RiLogoutBoxLine />}
          </span>
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// AVATAR BUTTON (desktop trigger)
// ─────────────────────────────────────────────────────────
function AvatarButton({ user, onSignOut, onChangePassword, onVerifyEmail }: {
  user: AuthUser;
  onSignOut?: () => Promise<void> | void;
  onChangePassword?: () => void;
  onVerifyEmail?: () => Promise<void> | void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent)    => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey  = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown",   onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          "flex items-center gap-2 rounded-xl px-2 py-1 transition-all duration-150",
          "hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80",
          open && "bg-zinc-100/80 dark:bg-zinc-800/80",
        )}
      >
        {/* Amber dot if unverified */}
        <div className="relative ">
          <UserAvatar user={user}  />
          {/* {!user.emailVerified && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-400 ring-1 ring-white dark:ring-zinc-900 z-10" />
          )} */}
        </div>
        <span className="hidden xl:block text-[13px] font-semibold text-zinc-700 dark:text-zinc-300 max-w-[120px] truncate">{user.name}</span>
        <svg className={cn("w-3.5 h-3.5 text-zinc-400 transition-transform duration-150 hidden xl:block", open && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <AccountDropdown
          user={user}
          onSignOut={onSignOut}
          onChangePassword={onChangePassword}
          onVerifyEmail={onVerifyEmail}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// MOBILE ACCOUNT SECTION
// ─────────────────────────────────────────────────────────
function MobileAccountSection({ user, onSignOut, onChangePassword, onVerifyEmail }: {
  user: AuthUser;
  onSignOut?: () => Promise<void> | void;
  onChangePassword?: () => void;
  onVerifyEmail?: () => Promise<void> | void;
}) {
  const [signingOut,    setSigningOut]    = useState(false);
  const [sendingVerify, setSendingVerify] = useState(false);
  const [verifyDone,    setVerifyDone]    = useState(false);
  const cfg = ROLE_CFG[user.role];

  return (
    <div className="flex flex-col gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
      <div className="flex items-center gap-3 px-1">
        <UserAvatar user={user} size="md" />
        <div className="flex-1 min-w-0">
          <p className="text-[13.5px] font-extrabold text-zinc-900 dark:text-zinc-50 truncate">{user.name}</p>
          <p className="text-[11.5px] text-zinc-500 dark:text-zinc-400 truncate">{user.email}</p>
          <span className={cn("mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10.5px] font-bold", cfg.badge)}>{cfg.icon} {cfg.label}</span>
        </div>
      </div>

      {!user.emailVerified && (
        <div className="px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/50">
          <div className="flex items-center gap-2 mb-1.5"><RiAlertLine className="text-amber-500 text-sm flex-shrink-0" /><p className="text-[12px] font-bold text-amber-700 dark:text-amber-300">Email not verified</p></div>
          <button
            onClick={async () => { setSendingVerify(true); try { await onVerifyEmail?.(); setVerifyDone(true); } finally { setSendingVerify(false); } }}
            disabled={sendingVerify || verifyDone}
            className={cn("w-full h-8 rounded-lg text-[12px] font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-60", verifyDone ? "bg-teal-100 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 cursor-default" : "bg-amber-500 hover:bg-amber-600 text-white")}
          >
            {sendingVerify ? <><RiLoader4Line className="animate-spin text-xs" />Sending…</> : verifyDone ? <><RiCheckLine className="text-xs" />Sent!</> : <><RiMailCheckLine className="text-xs" />Resend verification</>}
          </button>
        </div>
      )}

      <Link href={DASHBOARD_ROUTE[user.role]} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-teal-700 dark:hover:text-teal-300 transition-colors">
        <RiDashboardLine className="text-base" /> Go to Dashboard
      </Link>

      <button onClick={onChangePassword} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors w-full text-left">
        <RiLockPasswordLine className="text-base" /> Change password
      </button>

      <Button
        onClick={async () => { setSigningOut(true); try { await onSignOut?.(); } finally { setSigningOut(false); } }}
        disabled={signingOut}
        variant="outline"
        className="w-full rounded-xl border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-700 dark:hover:text-red-300 font-semibold gap-2"
      >
        {signingOut ? <RiLoader4Line className="animate-spin text-sm" /> : <RiLogoutBoxLine className="text-sm" />}
        {signingOut ? "Signing out…" : "Sign out"}
      </Button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// MENU RENDERERS
// ─────────────────────────────────────────────────────────
function renderMenuItem(item: MenuItem) {
  if (item.items) {
    return (
      <NavigationMenuItem key={item.title}>
        <NavigationMenuTrigger className="h-9 px-3 text-sm font-medium rounded-md bg-transparent text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/70 hover:text-zinc-900 dark:hover:text-zinc-50 data-[state=open]:bg-zinc-100/80 dark:data-[state=open]:bg-zinc-800/80 data-[state=open]:text-zinc-900 dark:data-[state=open]:text-zinc-50 transition-colors duration-150">
          {item.title}
        </NavigationMenuTrigger>
        <NavigationMenuContent>
          <div className="p-2 rounded-xl min-w-[320px] bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-xl shadow-zinc-900/10 dark:shadow-zinc-900/40">
            {item.items.map(sub => <NavigationMenuLink asChild key={sub.title}><SubMenuLink item={sub} /></NavigationMenuLink>)}
          </div>
        </NavigationMenuContent>
      </NavigationMenuItem>
    );
  }
  return (
    <NavigationMenuItem key={item.title}>
      <NavigationMenuLink href={item.url} className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/70 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors duration-150">
        {item.title}
      </NavigationMenuLink>
    </NavigationMenuItem>
  );
}

function renderMobileMenuItem(item: MenuItem) {
  if (item.items) {
    return (
      <AccordionItem key={item.title} value={item.title} className="border-b-0">
        <AccordionTrigger className="py-2 px-2 rounded-lg text-sm font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:no-underline transition-colors">{item.title}</AccordionTrigger>
        <AccordionContent className="pt-1 pb-2">
          <div className="flex flex-col gap-0.5 pl-1">{item.items.map(sub => <SubMenuLink key={sub.title} item={sub} mobile />)}</div>
        </AccordionContent>
      </AccordionItem>
    );
  }
  return (
    <a key={item.title} href={item.url} className="flex items-center h-9 px-2 rounded-lg text-sm font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-teal-600 dark:hover:text-teal-400 transition-colors">{item.title}</a>
  );
}

// ─────────────────────────────────────────────────────────
// MAIN NAVBAR
// ─────────────────────────────────────────────────────────
export function NavBar({
  logo = { url: "/", src: "/logo/nexora.png", alt: "Nexora", title: "Nexora" },
  menu = DEFAULT_MENU,
  auth = { login: { title: "Log in", url: "/auth/signin" }, signup: { title: "Get Started", url: "/auth/signup" } },
  user,
  isLoadingUser = false,
  onSignOut,
  onChangePassword,
  onVerifyEmail,
  className,
}: NavBarProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const isLoggedIn = !!user;

  /** The right-side slot has three states: loading skeleton / logged-in avatar / auth buttons */
  function RightSlot() {
    if (isLoadingUser) {
      return <AvatarSkeleton />;
    }
    if (isLoggedIn) {
      return (
        <AvatarButton
          user={user}
          onSignOut={onSignOut}
          onChangePassword={onChangePassword}
          onVerifyEmail={onVerifyEmail}
        />
      );
    }
    return (
      <>
        <Button asChild variant="ghost" size="sm" className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 font-medium">
          <a href={auth.login.url}>{auth.login.title}</a>
        </Button>
        <Button asChild size="sm" className="font-semibold gap-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white shadow-sm shadow-teal-600/20 transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]">
          <a href={auth.signup.url}>{auth.signup.title}<RiArrowRightLine className="text-sm" /></a>
        </Button>
      </>
    );
  }

  return (
    <div className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
      scrolled
        ? ["bg-white/75 dark:bg-zinc-950/80", "backdrop-blur-xl", "border-b border-zinc-200/60 dark:border-zinc-800/60", "shadow-sm shadow-zinc-900/5 dark:shadow-zinc-900/30"]
        : ["bg-transparent", "backdrop-blur-sm", "border-b border-transparent"],
      className,
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Desktop ── */}
        <nav className="hidden items-center justify-between lg:flex h-16">
          <div className="flex items-center gap-8">
            <LogoMark title={logo.title} />
            <NavigationMenu>
              <NavigationMenuList className="gap-0.5">
                {menu.map(item => renderMenuItem(item))}
              </NavigationMenuList>
            </NavigationMenu>
          </div>
          <div className="flex items-center gap-2">
            <ModeToggle />
            <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-1" />
            <RightSlot />
          </div>
        </nav>

        {/* ── Mobile ── */}
        <div className="flex lg:hidden items-center justify-between h-14">
          <LogoMark title={logo.title} />
          <div className="flex items-center gap-2">
            <ModeToggle />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm">
                  {isLoggedIn ? (
                    <div className="w-7 h-7 rounded-full overflow-hidden">
                      {user.image
                        ? <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-[11px] font-extrabold">{user.name.charAt(0).toUpperCase()}</div>}
                    </div>
                  ) : (
                    <RiMenuLine className="size-4 text-zinc-700 dark:text-zinc-300" />
                  )}
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>

              <SheetContent side="right" className="w-[300px] sm:w-[340px] overflow-y-auto border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl">
                <SheetHeader className="pb-2">
                  <SheetTitle asChild>
                    <a href={logo.url} className="flex items-center gap-2">
                      <span className="text-base font-bold text-zinc-900 dark:text-zinc-50">{logo.title}</span>
                    </a>
                  </SheetTitle>
                </SheetHeader>
                <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-4" />
                <div className="flex flex-col gap-6 px-1 pb-6">
                  <Accordion type="single" collapsible className="flex w-full flex-col gap-1">
                    {menu.map(item => renderMobileMenuItem(item))}
                  </Accordion>

                  {isLoggedIn ? (
                    <MobileAccountSection user={user} onSignOut={onSignOut} onChangePassword={onChangePassword} onVerifyEmail={onVerifyEmail} />
                  ) : (
                    <div className="flex flex-col gap-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                      <Button asChild variant="outline" className="w-full rounded-xl border-zinc-200 dark:border-zinc-700 font-medium"><a href={auth.login.url}>{auth.login.title}</a></Button>
                      <Button asChild className="w-full rounded-xl bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white font-semibold gap-2"><a href={auth.signup.url}>{auth.signup.title}<RiArrowRightLine className="text-sm" /></a></Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

      </div>
    </div>
  );
}