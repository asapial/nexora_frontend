"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  RiBellLine,
  RiShieldLine,
  RiAlertLine,
  RiCheckLine,
  RiMailLine,
  RiSmartphoneLine,
  RiToggleLine,
  RiToggleFill,
  RiLogoutBoxLine,
  RiDeleteBinLine,
  RiEditLine,
  RiSaveLine,
  RiLockLine,
  RiEyeLine,
  RiEyeOffLine,
  RiSparklingFill,
  RiComputerLine,
  RiLoader4Line,
  RiCloseLine,
  RiShieldCheckLine,
  RiFileDownloadLine,
  RiErrorWarningLine,
  RiKeyLine,
  RiQrCodeLine,
  RiFileCopyLine,
  RiCheckboxCircleLine,
  RiCodeLine,
  RiAddLine,
  RiDeleteBin6Line,
} from "react-icons/ri";

import { cn } from "@/lib/utils";
import { settingsApi } from "@/lib/api";
import { toast } from "sonner";

// ─── Tabs (Profile removed) ───────────────────────────────
const TABS = [
  { id: "notifications", label: "Notifications", icon: <RiBellLine /> },
  { id: "privacy", label: "Privacy & Security", icon: <RiShieldLine /> },
  // { id: "api", label: "API Keys", icon: <RiCodeLine /> },
  { id: "danger", label: "Danger Zone", icon: <RiAlertLine /> },
] as const;

type TabId = (typeof TABS)[number]["id"];

type EmailNotificationPrefs = {
  sessionCreated: boolean;
  submissionAlert: boolean;
  atRiskAlert: boolean;
  badgeEarned: boolean;
  weeklyDigest: boolean;
  marketing: boolean;
};

const DEFAULT_PRIVACY_PREFS = {
  profilePublic: true,
  showEmail: false,
  showClusters: true,
  activityVisible: false,
};

function mergeBoolPrefs<T extends Record<string, boolean>>(defaults: T, raw: unknown): T {
  if (!raw || typeof raw !== "object") return defaults;
  const o = raw as Record<string, unknown>;
  const out = { ...defaults };
  for (const k of Object.keys(defaults) as (keyof T)[]) {
    const v = o[String(k)];
    if (typeof v === "boolean") (out as Record<string, boolean>)[String(k)] = v;
  }
  return out;
}

// ─── Reusable primitives ───────────────────────────────────

function Section({ title, description, children, variant }: {
  title: string; description?: string; children: React.ReactNode; variant?: "danger";
}) {
  return (
    <div className={cn(
      "rounded-2xl border bg-card overflow-hidden",
      variant === "danger"
        ? "border-red-200/70 dark:border-red-900/50"
        : "border-border"
    )}>
      <div className={cn(
        "px-6 py-4 border-b",
        variant === "danger"
          ? "border-red-200/70 dark:border-red-900/50"
          : "border-border"
      )}>
        <h3 className={cn(
          "text-[14.5px] font-bold leading-none mb-0.5",
          variant === "danger"
            ? "text-red-600 dark:text-red-400"
            : "text-foreground"
        )}>{title}</h3>
        {description && <p className="text-[12.5px] text-muted-foreground">{description}</p>}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function ToggleRow({
  label, description, checked, onChange,
}: {
  label: string; description?: string;
  checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 border-b border-border/50 last:border-0">
      <div className="min-w-0">
        <p className="text-[13.5px] font-semibold text-foreground">{label}</p>
        {description && <p className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className="flex-shrink-0 transition-colors duration-150"
        role="switch"
        aria-checked={checked}
      >
        {checked ? (
          <RiToggleFill className="text-[2rem] text-teal-600 dark:text-teal-400" />
        ) : (
          <RiToggleLine className="text-[2rem] text-muted-foreground/40 hover:text-muted-foreground/60" />
        )}
      </button>
    </div>
  );
}

function SaveButton({ loading, saved, label }: { loading: boolean; saved: boolean; label?: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className={cn(
        "inline-flex items-center gap-2 h-10 px-6 rounded-xl",
        "text-[13.5px] font-bold",
        "transition-all duration-200",
        saved
          ? "bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 border border-teal-200/70 dark:border-teal-800/60"
          : "bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-600 text-white shadow-sm shadow-teal-600/20 hover:scale-[1.01] active:scale-[0.99]",
        "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
      )}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : saved ? (
        <><RiCheckLine /> Saved</>
      ) : (
        <><RiSaveLine /> {label ?? "Save changes"}</>
      )}
    </button>
  );
}

function PasswordField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-semibold text-foreground/80">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 text-base pointer-events-none">
          <RiLockLine />
        </span>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "w-full h-10 pl-9 pr-11 rounded-xl text-[13.5px] font-medium",
            "bg-muted/40 border border-border",
            "text-foreground placeholder:text-muted-foreground/40",
            "focus:outline-none focus:ring-2 focus:ring-teal-400/25 dark:focus:ring-teal-500/25",
            "focus:border-teal-400/60 dark:focus:border-teal-500/50",
            "transition-all duration-150"
          )}
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        >
          {show ? <RiEyeOffLine /> : <RiEyeLine />}
        </button>
      </div>
    </div>
  );
}

function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border h-36 animate-pulse bg-muted/30" />
      ))}
    </div>
  );
}

function ErrorBlock({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-950/20 px-4 py-3 text-[13px] text-red-600 dark:text-red-400">
      {message}
    </div>
  );
}

// ─── TAB: Notifications ────────────────────────────────────
const EMAIL_DEFAULTS: EmailNotificationPrefs = {
  sessionCreated: true,
  submissionAlert: true,
  atRiskAlert: true,
  badgeEarned: true,
  weeklyDigest: false,
  marketing: false,
};

type PushPrefs = {
  deadline: boolean;
  memberInactive: boolean;
  newSubmission: boolean;
  systemAnnounce: boolean;
};

const PUSH_DEFAULTS: PushPrefs = {
  deadline: true,
  memberInactive: true,
  newSubmission: false,
  systemAnnounce: true,
};

function NotificationsTab() {
  const [email, setEmail] = useState({ ...EMAIL_DEFAULTS });
  const [push, setPush] = useState({ ...PUSH_DEFAULTS });
  const [userEmail, setUserEmail] = useState("");
  const [pageLoading, setPageLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setPageLoading(true); setLoadError(null);
    try {
      const r = await settingsApi.getAccount();
      setUserEmail(r.data.user?.email ?? "");
      setEmail(mergeBoolPrefs({ ...EMAIL_DEFAULTS }, r.data.preferences?.emailNotifications));
      setPush(mergeBoolPrefs({ ...PUSH_DEFAULTS }, r.data.preferences?.pushNotifications));
    } catch (e: unknown) {
      setLoadError(e instanceof Error ? e.message : "Could not load preferences");
    } finally { setPageLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      await settingsApi.updateAccount({
        preferences: {
          emailNotifications: { ...email },
          pushNotifications: { ...push },
        },
      });
      toast.success("Notification preferences saved");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally { setLoading(false); }
  };

  if (pageLoading) return <LoadingSkeleton />;
  if (loadError) return <ErrorBlock message={loadError} />;

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-5">
      <Section title="Email Notifications" description="Choose what Nexora emails you about.">
        <div className="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/60 dark:border-teal-800/50">
          <RiMailLine className="text-teal-600 dark:text-teal-400 text-base flex-shrink-0" />
          <span className="text-[12.5px] font-semibold text-teal-700 dark:text-teal-300">
            Sending to: <span className="font-bold break-all">{userEmail || "your account email"}</span>
          </span>
          <Link href="/dashboard/profile" className="ml-auto text-[12px] font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-0.5">
            Change <RiEditLine className="text-xs" />
          </Link>
        </div>

        <ToggleRow label="Session created" description="When a new session is created in any of your clusters." checked={email.sessionCreated} onChange={v => setEmail(p => ({ ...p, sessionCreated: v }))} />
        <ToggleRow label="Submission alert" description="When a member submits a task." checked={email.submissionAlert} onChange={v => setEmail(p => ({ ...p, submissionAlert: v }))} />
        <ToggleRow label="At-risk cluster alert" description="When a cluster's health score drops below 50." checked={email.atRiskAlert} onChange={v => setEmail(p => ({ ...p, atRiskAlert: v }))} />
        <ToggleRow label="Badge earned" description="When a member earns a milestone badge in your cluster." checked={email.badgeEarned} onChange={v => setEmail(p => ({ ...p, badgeEarned: v }))} />
        <ToggleRow label="Weekly digest" description="A summary of cluster activity, pending reviews, and upcoming sessions every Monday." checked={email.weeklyDigest} onChange={v => setEmail(p => ({ ...p, weeklyDigest: v }))} />
        <ToggleRow label="Product updates" description="Occasional emails about new features and improvements to Nexora." checked={email.marketing} onChange={v => setEmail(p => ({ ...p, marketing: v }))} />
      </Section>

      <Section title="In-App &amp; Push Notifications" description="Real-time alerts shown inside Nexora.">
        <div className="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-xl bg-muted/40 border border-border">
          <RiSmartphoneLine className="text-muted-foreground text-base flex-shrink-0" />
          <span className="text-[12.5px] text-muted-foreground">
            Push notifications work in the browser and the Nexora mobile app.
          </span>
        </div>

        <ToggleRow label="Deadline reminders" description="24 h and 1 h before a task deadline." checked={push.deadline} onChange={v => setPush(p => ({ ...p, deadline: v }))} />
        <ToggleRow label="Inactive member alert" description="When a member has had zero activity for 7 consecutive days." checked={push.memberInactive} onChange={v => setPush(p => ({ ...p, memberInactive: v }))} />
        <ToggleRow label="New submission" description="Instant ping for each new submission in your clusters." checked={push.newSubmission} onChange={v => setPush(p => ({ ...p, newSubmission: v }))} />
        <ToggleRow label="System announcements" description="Platform maintenance, scheduled downtime and critical updates." checked={push.systemAnnounce} onChange={v => setPush(p => ({ ...p, systemAnnounce: v }))} />
      </Section>

      <div className="flex justify-end">
        <SaveButton loading={loading} saved={saved} />
      </div>
    </form>
  );
}

// ─── TAB: Privacy & Security ───────────────────────────────
type SessionInfo = {
  id: string;
  device: string;
  ipAddress: string;
  createdAt: string;
  isCurrent: boolean;
};

// 2FA setup wizard steps
type TwoFAStep = "idle" | "password" | "qr" | "verify" | "done";

function TwoFactorSection() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<TwoFAStep>("idle");
  const [password, setPassword] = useState("");
  const [totpURI, setTotpURI] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verifyCode, setVerifyCode] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedBackup, setCopiedBackup] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [disabling, setDisabling] = useState(false);

  useEffect(() => {
    settingsApi.getTwoFactorStatus()
      .then(r => setEnabled(r.data.twoFactorEnabled))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleEnableStart = () => {
    setStep("password");
    setPassword("");
    setError("");
  };

  const handlePasswordSubmit = async () => {
    if (!password) { setError("Password is required"); return; }
    setActionLoading(true); setError("");
    try {
      const result = await settingsApi.enableTwoFactor(password);
      setTotpURI(result.totpURI ?? result.data?.totpURI ?? "");
      const codes = result.backupCodes ?? result.data?.backupCodes ?? [];
      setBackupCodes(Array.isArray(codes) ? codes : []);
      setStep("qr");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to enable 2FA");
    } finally { setActionLoading(false); }
  };

  const handleVerify = async () => {
    if (verifyCode.length < 6) { setError("Enter a 6-digit code"); return; }
    setActionLoading(true); setError("");
    try {
      await settingsApi.verifyTwoFactor(verifyCode);
      setEnabled(true);
      setStep("done");
      toast.success("Two-factor authentication enabled!");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Invalid code");
    } finally { setActionLoading(false); }
  };

  const handleDisable = async () => {
    if (!disablePassword) { setError("Password is required"); return; }
    setDisabling(true); setError("");
    try {
      await settingsApi.disableTwoFactor(disablePassword);
      setEnabled(false);
      setStep("idle");
      setDisablePassword("");
      toast.success("Two-factor authentication disabled");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to disable 2FA");
    } finally { setDisabling(false); }
  };

  const handleCopyBackup = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    setCopiedBackup(true);
    setTimeout(() => setCopiedBackup(false), 2500);
    toast.success("Backup codes copied to clipboard");
  };

  const qrUrl = totpURI
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(totpURI)}`
    : "";

  if (loading) {
    return <div className="h-20 rounded-xl bg-muted/30 animate-pulse" />;
  }

  return (
    <Section title="Two-Factor Authentication" description="Add a second layer of security to your account.">
      {/* Already enabled — show status and disable option */}
      {enabled && step !== "done" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/60 dark:border-teal-800/50">
            <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center flex-shrink-0">
              <RiShieldCheckLine className="text-teal-600 dark:text-teal-400 text-lg" />
            </div>
            <div>
              <p className="text-[13.5px] font-bold text-teal-700 dark:text-teal-300">2FA is enabled</p>
              <p className="text-[12px] text-teal-600/80 dark:text-teal-400/70">Your account is protected with authenticator app (TOTP).</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 max-w-sm">
            <p className="text-[12.5px] text-muted-foreground">Enter your password to disable 2FA:</p>
            <PasswordField
              label="Current password"
              value={disablePassword}
              onChange={setDisablePassword}
              placeholder="Your password"
            />
            {error && (
              <div className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-[12.5px] text-red-600 dark:text-red-400 flex items-center gap-1.5">
                <RiErrorWarningLine className="flex-shrink-0" /> {error}
              </div>
            )}
            <button
              onClick={handleDisable}
              disabled={disabling}
              className="h-9 px-4 rounded-xl border border-border text-[13px] font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all disabled:opacity-50 w-fit"
            >
              {disabling ? <RiLoader4Line className="animate-spin inline mr-1.5" /> : null}
              Disable 2FA
            </button>
          </div>
        </div>
      )}

      {/* Not enabled — show enable button */}
      {!enabled && step === "idle" && (
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[13.5px] font-semibold text-foreground">Authenticator app (TOTP)</p>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              Protect your account with an authenticator app like Google Authenticator or Authy.
            </p>
          </div>
          <button
            onClick={handleEnableStart}
            className="flex-shrink-0 h-9 px-4 rounded-xl text-[13px] font-bold bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-600 text-white shadow-sm shadow-teal-600/20 transition-all"
          >
            Enable 2FA
          </button>
        </div>
      )}

      {/* Step 1: Enter password to start */}
      {!enabled && step === "password" && (
        <div className="flex flex-col gap-4 max-w-sm">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
            <RiKeyLine className="text-teal-500" />
            Step 1: Verify your identity
          </div>
          <p className="text-[12.5px] text-muted-foreground">Enter your account password to begin setup.</p>
          <PasswordField
            label="Password"
            value={password}
            onChange={setPassword}
            placeholder="Your current password"
          />
          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-[12.5px] text-red-600 dark:text-red-400 flex items-center gap-1.5">
              <RiErrorWarningLine className="flex-shrink-0" /> {error}
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => { setStep("idle"); setError(""); }}
              className="h-9 px-4 rounded-xl border border-border text-[13px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handlePasswordSubmit}
              disabled={actionLoading}
              className="h-9 px-5 rounded-xl text-[13px] font-bold bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-600 text-white shadow-sm transition-all disabled:opacity-50"
            >
              {actionLoading ? <RiLoader4Line className="animate-spin inline mr-1" /> : null}
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Scan QR code */}
      {!enabled && step === "qr" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
            <RiQrCodeLine className="text-teal-500" />
            Step 2: Scan QR Code
          </div>
          <p className="text-[12.5px] text-muted-foreground leading-relaxed">
            Open your authenticator app (Google Authenticator, Authy, etc.) and scan the QR code below.
          </p>

          <div className="flex flex-col sm:flex-row gap-5">
            {/* QR Code */}
            <div className="flex-shrink-0 p-4 rounded-2xl bg-white border border-border shadow-sm w-fit">
              {qrUrl ? (
                <img
                  src={qrUrl}
                  alt="TOTP QR Code"
                  width={180}
                  height={180}
                  className="rounded-lg"
                />
              ) : (
                <div className="w-[180px] h-[180px] rounded-lg bg-muted/30 flex items-center justify-center text-muted-foreground text-sm">
                  Loading...
                </div>
              )}
            </div>

            {/* Backup codes */}
            {backupCodes.length > 0 && (
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-[12.5px] font-bold text-foreground">Backup Codes</p>
                  <button
                    onClick={handleCopyBackup}
                    className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 flex items-center gap-1 hover:underline"
                  >
                    {copiedBackup ? <RiCheckLine /> : <RiFileCopyLine />}
                    {copiedBackup ? "Copied!" : "Copy all"}
                  </button>
                </div>
                <p className="text-[11.5px] text-muted-foreground mb-2">
                  Save these codes securely. Each code can be used once if you lose your authenticator.
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {backupCodes.map((code, i) => (
                    <div key={i} className="px-2.5 py-1.5 rounded-lg bg-muted/50 border border-border font-mono text-[12px] text-foreground/80">
                      {code}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => { setStep("verify"); setVerifyCode(""); setError(""); }}
            className="h-9 px-5 rounded-xl text-[13px] font-bold bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-600 text-white shadow-sm transition-all w-fit"
          >
            I&apos;ve scanned the code → Verify
          </button>
        </div>
      )}

      {/* Step 3: Verify TOTP code */}
      {!enabled && step === "verify" && (
        <div className="flex flex-col gap-4 max-w-sm">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
            <RiCheckboxCircleLine className="text-teal-500" />
            Step 3: Verify
          </div>
          <p className="text-[12.5px] text-muted-foreground">
            Enter the 6-digit code shown in your authenticator app to complete setup.
          </p>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-foreground/80">Verification code</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={verifyCode}
              onChange={e => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className={cn(
                "w-full h-12 px-4 rounded-xl text-center text-[20px] font-mono font-bold tracking-[.3em]",
                "bg-muted/40 border border-border",
                "text-foreground placeholder:text-muted-foreground/30",
                "focus:outline-none focus:ring-2 focus:ring-teal-400/25",
                "focus:border-teal-400/60 transition-all duration-150"
              )}
            />
          </div>
          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-[12.5px] text-red-600 dark:text-red-400 flex items-center gap-1.5">
              <RiErrorWarningLine className="flex-shrink-0" /> {error}
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => { setStep("qr"); setError(""); }}
              className="h-9 px-4 rounded-xl border border-border text-[13px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            >
              Back
            </button>
            <button
              onClick={handleVerify}
              disabled={actionLoading || verifyCode.length < 6}
              className="h-9 px-5 rounded-xl text-[13px] font-bold bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-600 text-white shadow-sm transition-all disabled:opacity-50"
            >
              {actionLoading ? <RiLoader4Line className="animate-spin inline mr-1" /> : null}
              Verify & Enable
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Done */}
      {step === "done" && (
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="w-14 h-14 rounded-full bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center">
            <RiShieldCheckLine className="text-teal-600 dark:text-teal-400 text-2xl" />
          </div>
          <p className="text-[14px] font-bold text-foreground">2FA is now enabled!</p>
          <p className="text-[12.5px] text-muted-foreground text-center max-w-sm">
            Your account is now protected with two-factor authentication. You&apos;ll need your authenticator app each time you log in.
          </p>
          <button
            onClick={() => setStep("idle")}
            className="h-9 px-5 rounded-xl border border-border text-[13px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all mt-2"
          >
            Done
          </button>
        </div>
      )}
    </Section>
  );
}

function PrivacyTab() {
  const [privacy, setPrivacy] = useState({ ...DEFAULT_PRIVACY_PREFS });
  const [pageLoading, setPageLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [prefLoading, setPrefLoading] = useState(false);
  const [prefSaved, setPrefSaved] = useState(false);

  const [pw, setPw] = useState({ current: "", newP: "", confirm: "" });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState("");

  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);

  const loadPrivacy = useCallback(async () => {
    setPageLoading(true); setLoadError(null);
    try {
      const r = await settingsApi.getAccount();
      setPrivacy(mergeBoolPrefs({ ...DEFAULT_PRIVACY_PREFS }, r.data.preferences?.privacy));
    } catch (e: unknown) {
      setLoadError(e instanceof Error ? e.message : "Could not load privacy settings");
    } finally { setPageLoading(false); }
  }, []);

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const r = await settingsApi.getSessions();
      setSessions(Array.isArray(r.data) ? r.data : []);
    } catch { /* silently fail — sessions section will show empty */ }
    finally { setSessionsLoading(false); }
  }, []);

  useEffect(() => { void loadPrivacy(); void loadSessions(); }, [loadPrivacy, loadSessions]);

  const handleSavePrivacy = async (e: React.FormEvent) => {
    e.preventDefault(); setPrefLoading(true);
    try {
      await settingsApi.updateAccount({ preferences: { privacy: { ...privacy } } });
      toast.success("Privacy settings saved");
      setPrefSaved(true);
      setTimeout(() => setPrefSaved(false), 2500);
      await loadPrivacy();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally { setPrefLoading(false); }
  };

  const handlePwSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pw.current) { setPwError("Current password is required"); return; }
    if (pw.newP.length < 8) { setPwError("New password must be at least 8 characters"); return; }
    if (pw.newP !== pw.confirm) { setPwError("Passwords do not match"); return; }
    setPwError(""); setPwLoading(true);
    try {
      await settingsApi.changePassword(pw.current, pw.newP);
      toast.success("Password changed successfully");
      setPwSaved(true);
      setPw({ current: "", newP: "", confirm: "" });
      setTimeout(() => setPwSaved(false), 2500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to change password";
      setPwError(msg);
      toast.error(msg);
    } finally { setPwLoading(false); }
  };

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingId(sessionId);
    try {
      await settingsApi.revokeSession(sessionId);
      toast.success("Session revoked");
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to revoke session");
    } finally { setRevokingId(null); }
  };

  const handleRevokeAll = async () => {
    setRevokingAll(true);
    try {
      const r = await settingsApi.revokeAllSessions();
      toast.success(r.data?.message ?? "Other sessions revoked");
      await loadSessions();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to revoke sessions");
    } finally { setRevokingAll(false); }
  };

  if (pageLoading) return <LoadingSkeleton rows={4} />;
  if (loadError) return <ErrorBlock message={loadError} />;

  const fmtDate = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Right now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Privacy toggles */}
      <form onSubmit={handleSavePrivacy} className="flex flex-col gap-5">
        <Section title="Profile Visibility" description="Control who can see your Nexora profile.">
          <ToggleRow label="Public profile" description="Anyone with the link can view your profile page." checked={privacy.profilePublic} onChange={v => setPrivacy(p => ({ ...p, profilePublic: v }))} />
          <ToggleRow label="Show email address" description="Show your email on your public profile." checked={privacy.showEmail} onChange={v => setPrivacy(p => ({ ...p, showEmail: v }))} />
          <ToggleRow label="Show courses" description="Show your enrolled/taught courses on your public profile." checked={privacy.showClusters} onChange={v => setPrivacy(p => ({ ...p, showClusters: v }))} />
          <ToggleRow label="Activity visible" description="Show your recent activity (sessions, submissions) to others." checked={privacy.activityVisible} onChange={v => setPrivacy(p => ({ ...p, activityVisible: v }))} />
        </Section>

        <div className="flex justify-end">
          <SaveButton loading={prefLoading} saved={prefSaved} />
        </div>
      </form>

      {/* Two-Factor Authentication — dedicated component with real TOTP flow */}
      <TwoFactorSection />

      {/* Change password */}
      <Section title="Change Password" description="Update your login password.">
        <form onSubmit={handlePwSubmit} className="flex flex-col gap-3 max-w-md">
          {pwError && (
            <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-[13px] font-medium text-red-600 dark:text-red-400 flex items-center gap-2">
              <RiErrorWarningLine className="flex-shrink-0" /> {pwError}
            </div>
          )}
          <PasswordField label="Current password" value={pw.current} onChange={v => setPw(p => ({ ...p, current: v }))} placeholder="Your current password" />
          <PasswordField label="New password" value={pw.newP} onChange={v => setPw(p => ({ ...p, newP: v }))} placeholder="Min. 8 characters" />
          <PasswordField label="Confirm new password" value={pw.confirm} onChange={v => setPw(p => ({ ...p, confirm: v }))} placeholder="Re-enter new password" />
          <div className="flex justify-start mt-1">
            <SaveButton loading={pwLoading} saved={pwSaved} label="Change password" />
          </div>
        </form>
      </Section>

      {/* Active Sessions */}
      <Section title="Active Sessions" description="Devices currently logged into your account.">
        {sessionsLoading ? (
          <div className="flex flex-col gap-2">
            {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-muted/30 animate-pulse" />)}
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-[13px] text-muted-foreground py-4 text-center">No active sessions found</p>
        ) : (
          <div className="flex flex-col gap-2">
            {sessions.map(s => (
              <div key={s.id} className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-muted/30 border border-border">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                    <RiComputerLine className="text-muted-foreground text-base" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-semibold text-foreground truncate">{s.device}</p>
                      {s.isCurrent && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100/80 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400 border border-teal-200/70 dark:border-teal-800/60">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-[11.5px] text-muted-foreground">{s.ipAddress} · {fmtDate(s.createdAt)}</p>
                  </div>
                </div>
                {!s.isCurrent && (
                  <button
                    onClick={() => handleRevokeSession(s.id)}
                    disabled={revokingId === s.id}
                    className="text-[12.5px] font-semibold text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors disabled:opacity-50 flex items-center gap-1 flex-shrink-0"
                  >
                    {revokingId === s.id ? <RiLoader4Line className="animate-spin" /> : <RiCloseLine />}
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        {sessions.filter(s => !s.isCurrent).length > 0 && (
          <button
            onClick={handleRevokeAll}
            disabled={revokingAll}
            className="mt-4 text-[13px] font-semibold text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            {revokingAll ? <RiLoader4Line className="animate-spin" /> : <RiLogoutBoxLine />}
            Sign out of all other sessions
          </button>
        )}
      </Section>
    </div>
  );
}

// ─── TAB: API Keys ─────────────────────────────────────────
type ApiKeyInfo = {
  id: string;
  label: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
};

function ApiTab() {
  const [keys, setKeys] = useState<ApiKeyInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState("");
  const [copied, setCopied] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await settingsApi.getApiKeys();
      setKeys(Array.isArray(r.data) ? r.data : []);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleGenerate = async () => {
    if (!newLabel.trim()) return;
    setGenerating(true);
    try {
      const r = await settingsApi.generateApiKey(newLabel.trim());
      setNewlyCreatedKey(r.data.apiKey);
      setNewLabel("");
      setShowForm(false);
      await load();
      toast.success("API key generated! Copy it now — it won't be shown again.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to generate key");
    } finally { setGenerating(false); }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(newlyCreatedKey);
    setCopied(true);
    toast.success("API key copied!");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDelete = async (keyId: string) => {
    setDeletingId(keyId);
    try {
      await settingsApi.deleteApiKey(keyId);
      toast.success("API key deleted");
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete key");
    } finally { setDeletingId(null); }
  };

  const handleRevokeAll = async () => {
    if (!confirm("Revoke ALL API keys? This cannot be undone.")) return;
    setRevokingAll(true);
    try {
      await settingsApi.revokeAllApiKeys();
      toast.success("All API keys revoked");
      setNewlyCreatedKey("");
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to revoke keys");
    } finally { setRevokingAll(false); }
  };

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  if (loading) return <LoadingSkeleton rows={2} />;

  return (
    <div className="flex flex-col gap-5">
      {/* Newly created key banner */}
      {newlyCreatedKey && (
        <div className="rounded-2xl border border-teal-200/70 dark:border-teal-800/50 bg-teal-50/60 dark:bg-teal-950/30 p-5">
          <div className="flex items-center gap-2 mb-2">
            <RiKeyLine className="text-teal-600 dark:text-teal-400" />
            <p className="text-[13.5px] font-bold text-teal-700 dark:text-teal-300">
              New API Key Created
            </p>
          </div>
          <p className="text-[12px] text-teal-600/80 dark:text-teal-400/70 mb-3">
            Copy this key now. You won&apos;t be able to see it again.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-black/30 border border-teal-200 dark:border-teal-800/60 text-[12px] font-mono text-foreground break-all select-all">
              {newlyCreatedKey}
            </code>
            <button onClick={handleCopy}
              className="flex-shrink-0 h-9 px-3 rounded-lg flex items-center gap-1.5 text-[12px] font-bold text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/40 border border-teal-200/70 dark:border-teal-800/50 transition-all">
              {copied ? <><RiCheckLine /> Copied</> : <><RiFileCopyLine /> Copy</>}
            </button>
          </div>
          <button onClick={() => setNewlyCreatedKey("")}
            className="mt-3 text-[11.5px] font-semibold text-teal-600/60 hover:text-teal-600 transition-colors">
            Dismiss
          </button>
        </div>
      )}

      <Section title="API Keys" description="Manage programmatic access to the Nexora API.">
        <div className="flex items-start gap-3 mb-5 px-3 py-2.5 rounded-xl bg-muted/40 border border-border">
          <RiCodeLine className="text-muted-foreground text-base mt-0.5 flex-shrink-0" />
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            API keys allow external tools and scripts to access Nexora on your behalf.
            Each key has a <code className="font-mono text-[11px]">nxra_</code> prefix. You can create up to 5 keys.
          </p>
        </div>

        {/* Key list */}
        {keys.length === 0 ? (
          <p className="text-[13px] text-muted-foreground py-6 text-center">
            No API keys yet. Create one to get started.
          </p>
        ) : (
          <div className="flex flex-col gap-2 mb-4">
            {keys.map(k => (
              <div key={k.id} className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-muted/30 border border-border">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                    <RiKeyLine className="text-muted-foreground text-base" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-foreground truncate">{k.label}</p>
                    <p className="text-[11.5px] text-muted-foreground font-mono">
                      {k.keyPrefix}••••••••••••
                      <span className="font-sans ml-2">· Created {fmtDate(k.createdAt)}</span>
                    </p>
                  </div>
                </div>
                <button onClick={() => handleDelete(k.id)} disabled={deletingId === k.id}
                  className="text-[12px] font-semibold text-red-500 dark:text-red-400 hover:text-red-600 transition-colors disabled:opacity-50 flex items-center gap-1 flex-shrink-0">
                  {deletingId === k.id ? <RiLoader4Line className="animate-spin" /> : <RiDeleteBin6Line />}
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Create new key form */}
        {showForm ? (
          <div className="flex flex-col gap-3 max-w-md">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-foreground/80">Key label</label>
              <input value={newLabel} onChange={e => setNewLabel(e.target.value)}
                placeholder="e.g. CI/CD Pipeline, Mobile App"
                className={cn(
                  "w-full h-10 px-4 rounded-xl text-[13.5px] font-medium",
                  "bg-muted/40 border border-border",
                  "text-foreground placeholder:text-muted-foreground/40",
                  "focus:outline-none focus:ring-2 focus:ring-teal-400/25",
                  "focus:border-teal-400/60 transition-all duration-150"
                )} />
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setShowForm(false); setNewLabel(""); }}
                className="h-9 px-4 rounded-xl border border-border text-[13px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                Cancel
              </button>
              <button onClick={handleGenerate} disabled={generating || !newLabel.trim()}
                className="h-9 px-5 rounded-xl text-[13px] font-bold bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-600 text-white shadow-sm transition-all disabled:opacity-50">
                {generating ? <RiLoader4Line className="animate-spin inline mr-1" /> : null}
                Generate key
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-xl text-[13px] font-bold bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-600 text-white shadow-sm shadow-teal-600/20 transition-all">
              <RiAddLine /> Create new key
            </button>
            {keys.length > 0 && (
              <button onClick={handleRevokeAll} disabled={revokingAll}
                className="text-[12.5px] font-semibold text-red-500 dark:text-red-400 hover:text-red-600 transition-colors flex items-center gap-1 disabled:opacity-50">
                {revokingAll ? <RiLoader4Line className="animate-spin" /> : <RiDeleteBinLine />}
                Revoke all
              </button>
            )}
          </div>
        )}
      </Section>
    </div>
  );
}

// ─── TAB: Danger Zone ──────────────────────────────────────
function DangerTab() {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [exporting, setExporting] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await settingsApi.exportDataPDF();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nexora-data-export-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Data exported as PDF and downloaded!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    } finally { setExporting(false); }
  };

  const handleDeactivate = async () => {
    if (!confirm("Are you sure you want to deactivate your account? You can reactivate by logging in again.")) return;
    setDeactivating(true);
    try {
      await settingsApi.deactivateAccount();
      toast.success("Account deactivated");
      router.push("/auth/signin");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Deactivation failed");
    } finally { setDeactivating(false); }
  };

  const handleDelete = async () => {
    if (confirmText !== "DELETE") return;
    setDeleting(true);
    try {
      await settingsApi.deleteAccount(confirmText);
      toast.success("Account permanently deleted");
      router.push("/auth/signin");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Deletion failed");
    } finally { setDeleting(false); }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Export data */}
      <Section title="Export Your Data" description="Download a full copy of your Nexora data as PDF.">
        <p className="text-[13.5px] text-muted-foreground leading-relaxed mb-4">
          Your export will include all profile data, course enrollments, certificates, cluster memberships,
          badges, and account settings in a professionally formatted PDF report. The file will be downloaded instantly.
        </p>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-xl border border-border bg-muted/50 hover:bg-muted text-[13.5px] font-semibold text-foreground/80 hover:text-foreground transition-all duration-150 disabled:opacity-50"
        >
          {exporting ? <RiLoader4Line className="animate-spin" /> : <RiFileDownloadLine />}
          {exporting ? "Generating PDF…" : "Download PDF export"}
        </button>
      </Section>

      {/* Deactivate */}
      <Section title="Deactivate Account" description="Temporarily disable your account. You can reactivate later.">
        <p className="text-[13.5px] text-muted-foreground leading-relaxed mb-4">
          Deactivating hides your profile and suspends all notifications.
          Your data is preserved. You can reactivate by logging back in at any time.
        </p>
        <button
          onClick={handleDeactivate}
          disabled={deactivating}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-xl border border-amber-300/70 dark:border-amber-700/50 bg-amber-50/60 dark:bg-amber-950/20 text-[13.5px] font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-100/60 dark:hover:bg-amber-950/40 transition-all duration-150 disabled:opacity-50"
        >
          {deactivating ? <RiLoader4Line className="animate-spin" /> : <RiShieldCheckLine />}
          {deactivating ? "Deactivating…" : "Deactivate my account"}
        </button>
      </Section>

      {/* Delete */}
      <Section title="Delete Account" description="This action is permanent and cannot be undone." variant="danger">
        {!confirmDelete ? (
          <>
            <p className="text-[13.5px] text-muted-foreground leading-relaxed mb-4">
              Permanently deletes your account, all course enrollments, certificates, cluster memberships,
              and progress data. This cannot be reversed. You will lose access immediately.
            </p>
            <button
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200/70 dark:border-red-800/50 text-[13.5px] font-bold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50 transition-all duration-150"
            >
              <RiDeleteBinLine /> Delete my account
            </button>
          </>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50">
              <p className="text-[13px] font-semibold text-red-600 dark:text-red-400 mb-1">
                ⚠ This will permanently delete everything.
              </p>
              <p className="text-[12.5px] text-red-500/80 dark:text-red-400/70 leading-relaxed">
                All enrollments, certificates, cluster data, and progress will be gone forever.
                Type <strong className="font-mono">DELETE</strong> to confirm.
              </p>
            </div>
            <div>
              <label className="text-[13px] font-semibold text-foreground/80 block mb-1.5">
                Type DELETE to confirm
              </label>
              <input
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className={cn(
                  "w-full max-w-xs h-10 px-4 rounded-xl text-[13.5px] font-mono font-bold",
                  "bg-muted/40 border border-border",
                  "text-foreground placeholder:text-muted-foreground/30",
                  "focus:outline-none focus:ring-2 focus:ring-red-400/25",
                  "focus:border-red-400/60 transition-all duration-150"
                )}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setConfirmDelete(false); setConfirmText(""); }}
                className="h-10 px-5 rounded-xl border border-border bg-muted/50 hover:bg-muted text-[13px] font-semibold text-muted-foreground hover:text-foreground transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={confirmText !== "DELETE" || deleting}
                className="inline-flex items-center gap-2 h-10 px-5 rounded-xl text-[13px] font-bold text-white bg-red-600 hover:bg-red-700 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed shadow-sm shadow-red-600/20 disabled:shadow-none transition-all duration-150"
              >
                {deleting ? <RiLoader4Line className="animate-spin" /> : <RiDeleteBinLine />}
                {deleting ? "Deleting…" : "Permanently delete"}
              </button>
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────
export default function AccountSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("notifications");

  return (
    <div className="p-5 lg:p-7 pt-6 max-w-5xl mx-auto w-full">
      <div className="flex flex-1 flex-col gap-6 p-5 lg:p-7 pt-6">

        {/* Page title */}
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <RiSparklingFill className="text-teal-500 dark:text-teal-400 text-sm animate-pulse" />
            <span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">Settings</span>
          </div>
          <h1 className="text-[1.4rem] font-extrabold tracking-tight text-foreground leading-none mb-0.5">
            Account Settings
          </h1>
          <p className="text-[13px] text-muted-foreground">
            Manage your notifications, privacy, and account security.
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 p-1 rounded-2xl bg-muted/50 border border-border w-fit flex-wrap">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "inline-flex items-center gap-2 h-9 px-4 rounded-xl",
                "text-[13px] font-semibold transition-all duration-150",
                activeTab === tab.id
                  ? "bg-background text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                tab.id === "danger" && activeTab === "danger" && "!text-red-600 dark:!text-red-400"
              )}
            >
              <span className={cn(
                "text-base",
                activeTab === tab.id && tab.id !== "danger" && "text-teal-600 dark:text-teal-400",
                activeTab === tab.id && tab.id === "danger" && "text-red-500 dark:text-red-400",
              )}>
                {tab.icon}
              </span>
              <span className="hidden sm:block">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="max-w-3xl w-full">
          {activeTab === "notifications" && <NotificationsTab />}
          {activeTab === "privacy" && <PrivacyTab />}
          {/* {activeTab === "api" && <ApiTab />} */}
          {activeTab === "danger" && <DangerTab />}
        </div>

      </div>
    </div>
  );
}