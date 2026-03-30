"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  RiUserSettingsLine,
  RiBellLine,
  RiShieldLine,
  RiAlertLine,
  RiCheckLine,
  RiArrowRightLine,
  RiMailLine,
  RiSmartphoneLine,
  RiToggleLine,
  RiToggleFill,
  RiLogoutBoxLine,
  RiDeleteBinLine,
  RiDownloadLine,
  RiEditLine,
  RiSaveLine,
  RiGlobalLine,
  RiLockLine,
  RiBriefcaseLine,
  RiMapPinLine,
  RiBookOpenLine,
  RiUserLine,
  RiLinkedinBoxLine,
  RiGithubLine,
  RiPhoneLine,
  RiEyeLine,
  RiEyeOffLine,
} from "react-icons/ri";

import { cn } from "@/lib/utils";
import { settingsApi } from "@/lib/api";
import { toast } from "sonner";

// ─── Tabs ──────────────────────────────────────────────────
const TABS = [
  { id: "profile", label: "Profile", icon: <RiUserSettingsLine /> },
  { id: "notifications", label: "Notifications", icon: <RiBellLine /> },
  { id: "privacy", label: "Privacy", icon: <RiShieldLine /> },
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

type ProfileForm = {
  name: string;
  email: string;
  phone: string;
  institution: string;
  department: string;
  location: string;
  website: string;
  github: string;
  linkedin: string;
  bio: string;
  timezone: string;
  language: string;
};

const EMPTY_PROFILE: ProfileForm = {
  name: "",
  email: "",
  phone: "",
  institution: "",
  department: "",
  location: "",
  website: "",
  github: "",
  linkedin: "",
  bio: "",
  timezone: "UTC",
  language: "English",
};

const DEFAULT_PRIVACY_PREFS = {
  profilePublic: true,
  showEmail: false,
  showClusters: true,
  activityVisible: false,
  twoFactor: false,
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

// Section card
function Section({ title, description, children }: {
  title: string; description?: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h3 className="text-[14.5px] font-bold text-foreground leading-none mb-0.5">{title}</h3>
        {description && <p className="text-[12.5px] text-muted-foreground">{description}</p>}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

// Labelled input
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-semibold text-foreground/80">{label}</label>
      {children}
      {hint && <p className="text-[11.5px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

// Text input
function TextInput({
  value, onChange, placeholder, type = "text", icon, readonly,
}: {
  value: string; onChange?: (v: string) => void;
  placeholder?: string; type?: string;
  icon?: React.ReactNode; readonly?: boolean;
}) {
  return (
    <div className="relative">
      {icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 text-base pointer-events-none">
          {icon}
        </span>
      )}
      <input
        type={type}
        value={value}
        readOnly={readonly}
        onChange={e => onChange?.(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full h-10 rounded-xl text-[13.5px] font-medium",
          icon ? "pl-9 pr-4" : "px-4",
          "bg-muted/40 border border-border",
          "text-foreground placeholder:text-muted-foreground/40",
          "focus:outline-none focus:ring-2 focus:ring-teal-400/25 dark:focus:ring-teal-500/25",
          "focus:border-teal-400/60 dark:focus:border-teal-500/50",
          "transition-all duration-150",
          readonly && "opacity-60 cursor-not-allowed"
        )}
      />
    </div>
  );
}

// Textarea
function TextArea({ value, onChange, rows = 3 }: { value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <textarea
      rows={rows}
      value={value}
      onChange={e => onChange(e.target.value)}
      className={cn(
        "w-full rounded-xl px-4 py-3 text-[13.5px] font-medium leading-relaxed resize-none",
        "bg-muted/40 border border-border",
        "text-foreground placeholder:text-muted-foreground/40",
        "focus:outline-none focus:ring-2 focus:ring-teal-400/25 dark:focus:ring-teal-500/25",
        "focus:border-teal-400/60 dark:focus:border-teal-500/50",
        "transition-all duration-150"
      )}
    />
  );
}

// Toggle row
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

// Save button
function SaveButton({ loading, saved }: { loading: boolean; saved: boolean }) {
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
        <><RiSaveLine /> Save changes</>
      )}
    </button>
  );
}

// Password field with show/hide
function PasswordField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <Field label={label}>
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
    </Field>
  );
}

// ─── TAB: Profile ──────────────────────────────────────────
function ProfileTab() {
  const [form, setForm] = useState<ProfileForm>(EMPTY_PROFILE);
  const [profileType, setProfileType] = useState<"teacher" | "student" | "admin" | "none" | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingPage, setLoadingPage] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const set = (k: keyof ProfileForm) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const load = useCallback(async () => {
    setLoadingPage(true); setLoadError(null);
    try {
      const r = await settingsApi.getAccount();
      const { user, profile, profileType: pt, preferences } = r.data;
      setProfileType(pt);
      const org =
        profile?.institution ??
        profile?.organization ??
        "";
      setForm({
        ...EMPTY_PROFILE,
        name: user?.name ?? "",
        email: user?.email ?? "",
        bio: profile?.bio ?? "",
        institution: org,
        department: profile?.department ?? "",
        website: profile?.website ?? "",
        linkedin: profile?.linkedinUrl ?? "",
        github: profile?.githubUrl ?? "",
        phone: profile?.phone ?? "",
        location: profile?.address ?? "",
        timezone: preferences?.timezone ?? EMPTY_PROFILE.timezone,
        language: preferences?.language ?? EMPTY_PROFILE.language,
      });
    } catch (e: unknown) {
      setLoadError(e instanceof Error ? e.message : "Could not load profile");
    } finally {
      setLoadingPage(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const body: Record<string, unknown> = { name: form.name };
      if (profileType === "teacher") {
        body.teacherProfile = {
          institution: form.institution || undefined,
          department: form.department || undefined,
          bio: form.bio || undefined,
          website: form.website || undefined,
          linkedinUrl: form.linkedin || undefined,
        };
      } else if (profileType === "student") {
        body.studentProfile = {
          phone: form.phone || undefined,
          address: form.location || undefined,
          institution: form.institution || undefined,
          department: form.department || undefined,
          bio: form.bio || undefined,
          website: form.website || undefined,
          githubUrl: form.github || undefined,
          linkedinUrl: form.linkedin || undefined,
        };
      } else if (profileType === "admin") {
        body.adminProfile = {
          phone: form.phone || undefined,
          bio: form.bio || undefined,
          department: form.department || undefined,
          organization: form.institution || undefined,
          linkedinUrl: form.linkedin || undefined,
          website: form.website || undefined,
        };
      }
      body.preferences = {
        timezone: form.timezone,
        language: form.language,
      };
      await settingsApi.updateAccount(body);
      toast.success("Profile saved", { position: "top-right" });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Save failed", { position: "top-right" });
    } finally {
      setLoading(false);
    }
  };

  if (loadingPage) {
    return (
      <div className="flex flex-col gap-4 max-w-3xl">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border h-36 animate-pulse bg-muted/30" />
        ))}
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-2xl border border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-950/20 px-4 py-3 text-[13px] text-red-600 dark:text-red-400">
        {loadError}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Basic info */}
      <Section title="Basic Information" description="Your name, contact details and how others find you.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full name">
            <TextInput value={form.name} onChange={set("name")} icon={<RiUserLine />} placeholder="Your full name" />
          </Field>
          <Field label="Email address" hint="Read-only. Use your auth provider to change email.">
            <TextInput value={form.email} icon={<RiMailLine />} placeholder="you@example.com" type="email" readonly />
          </Field>
          <Field label="Phone number">
            <TextInput value={form.phone} onChange={set("phone")} icon={<RiPhoneLine />} placeholder="+1 234 567 8900" />
          </Field>
          <Field label="Location">
            <TextInput value={form.location} onChange={set("location")} icon={<RiMapPinLine />} placeholder="City, Country" />
          </Field>
          <Field label="Institution">
            <TextInput value={form.institution} onChange={set("institution")} icon={<RiBriefcaseLine />} placeholder="Your university / organisation" />
          </Field>
          <Field label="Department">
            <TextInput value={form.department} onChange={set("department")} icon={<RiBookOpenLine />} placeholder="e.g. Computer Science" />
          </Field>
        </div>
      </Section>

      {/* Bio */}
      <Section title="Bio" description="Displayed on your public profile page.">
        <TextArea value={form.bio} onChange={set("bio")} rows={4} />
        <p className="mt-2 text-[11.5px] text-muted-foreground text-right">{form.bio.length}/500</p>
      </Section>

      {/* Links */}
      <Section title="Online Presence" description="Links shown on your profile.">
        <div className="flex flex-col gap-3">
          <Field label="Website">
            <TextInput value={form.website} onChange={set("website")} icon={<RiGlobalLine />} placeholder="https://yourwebsite.com" type="url" />
          </Field>
          <Field label="GitHub username">
            <TextInput value={form.github} onChange={set("github")} icon={<RiGithubLine />} placeholder="github-username" />
          </Field>
          <Field label="LinkedIn username">
            <TextInput value={form.linkedin} onChange={set("linkedin")} icon={<RiLinkedinBoxLine />} placeholder="linkedin-username" />
          </Field>
        </div>
      </Section>

      {/* Preferences */}
      <Section title="Preferences" description="Localisation and display preferences.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Timezone">
            <select
              value={form.timezone}
              onChange={e => set("timezone")(e.target.value)}
              className={cn(
                "w-full h-10 px-4 rounded-xl text-[13.5px] font-medium",
                "bg-muted/40 border border-border text-foreground",
                "focus:outline-none focus:ring-2 focus:ring-teal-400/25 dark:focus:ring-teal-500/25",
                "focus:border-teal-400/60 dark:focus:border-teal-500/50",
                "transition-all duration-150"
              )}
            >
              {["Asia/Kolkata (UTC+5:30)", "UTC", "America/New_York (UTC-5)", "Europe/London (UTC+0)", "Asia/Tokyo (UTC+9)"].map(tz => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </Field>
          <Field label="Language">
            <select
              value={form.language}
              onChange={e => set("language")(e.target.value)}
              className={cn(
                "w-full h-10 px-4 rounded-xl text-[13.5px] font-medium",
                "bg-muted/40 border border-border text-foreground",
                "focus:outline-none focus:ring-2 focus:ring-teal-400/25 dark:focus:ring-teal-500/25",
                "focus:border-teal-400/60 dark:focus:border-teal-500/50",
                "transition-all duration-150"
              )}
            >
              {["English", "Hindi", "Tamil", "French", "German", "Spanish"].map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </Field>
        </div>
      </Section>

      <div className="flex justify-end">
        <SaveButton loading={loading} saved={saved} />
      </div>
    </form>
  );
}

// ─── TAB: Notifications ────────────────────────────────────
const EMAIL_NOTIFICATION_DEFAULTS: EmailNotificationPrefs = {
  sessionCreated: true,
  submissionAlert: true,
  atRiskAlert: true,
  badgeEarned: true,
  weeklyDigest: false,
  marketing: false,
};

type PushNotificationPrefs = {
  deadline: boolean;
  memberInactive: boolean;
  newSubmission: boolean;
  systemAnnounce: boolean;
};

const PUSH_NOTIFICATION_DEFAULTS: PushNotificationPrefs = {
  deadline: true,
  memberInactive: true,
  newSubmission: false,
  systemAnnounce: true,
};


function NotificationsTab() {
  const [email, setEmail] = useState({ ...EMAIL_NOTIFICATION_DEFAULTS });
  const [push, setPush] = useState({ ...PUSH_NOTIFICATION_DEFAULTS });
  const [userEmail, setUserEmail] = useState("");
  const [pageLoading, setPageLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setPageLoading(true);
    setLoadError(null);
    try {
      const r = await settingsApi.getAccount();
      setUserEmail(r.data.user?.email ?? "");
      setEmail(mergeBoolPrefs({ ...EMAIL_NOTIFICATION_DEFAULTS }, r.data.preferences?.emailNotifications));
      setPush(mergeBoolPrefs({ ...PUSH_NOTIFICATION_DEFAULTS }, r.data.preferences?.pushNotifications));
    } catch (e: unknown) {
      setLoadError(e instanceof Error ? e.message : "Could not load preferences");
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await settingsApi.updateAccount({
        preferences: {
          emailNotifications: { ...email },
          pushNotifications: { ...push },
        },
      });
      toast.success("Notification preferences saved", { position: "top-right" });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Save failed", { position: "top-right" });
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex flex-col gap-4 max-w-3xl">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border h-36 animate-pulse bg-muted/30" />
        ))}
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-2xl border border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-950/20 px-4 py-3 text-[13px] text-red-600 dark:text-red-400">
        {loadError}
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-5">
      {/* Email */}
      <Section
        title="Email Notifications"
        description="Choose what Nexora emails you about."
      >
        <div className="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-xl
                        bg-teal-50/60 dark:bg-teal-950/30
                        border border-teal-200/60 dark:border-teal-800/50">
          <RiMailLine className="text-teal-600 dark:text-teal-400 text-base flex-shrink-0" />
          <span className="text-[12.5px] font-semibold text-teal-700 dark:text-teal-300">
            Sending to:{" "}
            <span className="font-bold break-all">{userEmail || "your account email"}</span>
          </span>
          <Link href="#" className="ml-auto text-[12px] font-semibold text-teal-600 dark:text-teal-400
                                    hover:underline flex items-center gap-0.5">
            Change <RiEditLine className="text-xs" />
          </Link>
        </div>

        <ToggleRow label="Session created" description="When you or a co-supervisor creates a new session in any of your clusters." checked={email.sessionCreated} onChange={v => setEmail(p => ({ ...p, sessionCreated: v }))} />
        <ToggleRow label="Submission alert" description="When a member submits a task." checked={email.submissionAlert} onChange={v => setEmail(p => ({ ...p, submissionAlert: v }))} />
        <ToggleRow label="At-risk cluster alert" description="When a cluster's health score drops below 50." checked={email.atRiskAlert} onChange={v => setEmail(p => ({ ...p, atRiskAlert: v }))} />
        <ToggleRow label="Badge earned" description="When a member earns a milestone badge in your cluster." checked={email.badgeEarned} onChange={v => setEmail(p => ({ ...p, badgeEarned: v }))} />
        <ToggleRow label="Weekly digest" description="A summary of cluster activity, pending reviews, and upcoming sessions every Monday." checked={email.weeklyDigest} onChange={v => setEmail(p => ({ ...p, weeklyDigest: v }))} />
        <ToggleRow label="Product updates" description="Occasional emails about new features and improvements to Nexora." checked={email.marketing} onChange={v => setEmail(p => ({ ...p, marketing: v }))} />
      </Section>

      {/* Push */}
      <Section
        title="In-App &amp; Push Notifications"
        description="Real-time alerts shown inside Nexora."
      >
        <div className="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-xl
                        bg-muted/40 border border-border">
          <RiSmartphoneLine className="text-muted-foreground text-base flex-shrink-0" />
          <span className="text-[12.5px] text-muted-foreground">
            Push notifications work in the browser and the Nexora mobile app.
          </span>
        </div>

        <ToggleRow label="Deadline reminders" description="24 h and 1 h before a task deadline in any of your clusters." checked={push.deadline} onChange={v => setPush(p => ({ ...p, deadline: v }))} />
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

  const loadPrivacy = useCallback(async () => {
    setPageLoading(true);
    setLoadError(null);
    try {
      const r = await settingsApi.getAccount();
      setPrivacy(mergeBoolPrefs({ ...DEFAULT_PRIVACY_PREFS }, r.data.preferences?.privacy));
    } catch (e: unknown) {
      setLoadError(e instanceof Error ? e.message : "Could not load privacy settings");
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => { void loadPrivacy(); }, [loadPrivacy]);

  const handleSavePrivacy = async (e: React.FormEvent) => {
    e.preventDefault();
    setPrefLoading(true);
    try {
      await settingsApi.updateAccount({
        preferences: { privacy: { ...privacy } },
      });
      toast.success("Privacy settings saved", { position: "top-right" });
      setPrefSaved(true);
      setTimeout(() => setPrefSaved(false), 2500);
      await loadPrivacy();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Save failed", { position: "top-right" });
    } finally {
      setPrefLoading(false);
    }
  };

  const handlePwSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pw.current) { setPwError("Current password is required"); return; }
    if (pw.newP.length < 8) { setPwError("New password must be at least 8 characters"); return; }
    if (pw.newP !== pw.confirm) { setPwError("Passwords do not match"); return; }
    setPwError(""); setPwLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setPwLoading(false); setPwSaved(true); setPw({ current: "", newP: "", confirm: "" });
    setTimeout(() => setPwSaved(false), 2500);
  };

  if (pageLoading) {
    return (
      <div className="flex flex-col gap-4 max-w-3xl">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border h-28 animate-pulse bg-muted/30" />
        ))}
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-2xl border border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-950/20 px-4 py-3 text-[13px] text-red-600 dark:text-red-400">
        {loadError}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <form onSubmit={handleSavePrivacy} className="flex flex-col gap-5">
        <Section title="Profile Visibility" description="Control who can see your Nexora profile.">
          <ToggleRow label="Public profile" description="Anyone with the link can view your profile page." checked={privacy.profilePublic} onChange={v => setPrivacy(p => ({ ...p, profilePublic: v }))} />
          <ToggleRow label="Show email address" description="Show your email on your public profile." checked={privacy.showEmail} onChange={v => setPrivacy(p => ({ ...p, showEmail: v }))} />
          <ToggleRow label="Show clusters" description="Show the clusters you manage on your public profile." checked={privacy.showClusters} onChange={v => setPrivacy(p => ({ ...p, showClusters: v }))} />
          <ToggleRow label="Activity visible" description="Show your recent activity (sessions, submissions) to others." checked={privacy.activityVisible} onChange={v => setPrivacy(p => ({ ...p, activityVisible: v }))} />
        </Section>

        <Section title="Two-Factor Authentication" description="Add a second layer of security to your account.">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[13.5px] font-semibold text-foreground">Authenticator app (TOTP)</p>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                {privacy.twoFactor
                  ? "2FA is enabled. Your account is protected."
                  : "Protect your account with an authenticator app like Google Authenticator."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPrivacy(p => ({ ...p, twoFactor: !p.twoFactor }))}
              className={cn(
                "flex-shrink-0 h-9 px-4 rounded-xl text-[13px] font-bold transition-all duration-150",
                privacy.twoFactor
                  ? "border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                  : "bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-600 text-white shadow-sm shadow-teal-600/20"
              )}
            >
              {privacy.twoFactor ? "Disable" : "Enable 2FA"}
            </button>
          </div>
        </Section>

        <div className="flex justify-end">
          <SaveButton loading={prefLoading} saved={prefSaved} />
        </div>
      </form>

      {/* Change password */}
      <Section title="Change Password" description="Update your login password.">
        <form onSubmit={handlePwSubmit} className="flex flex-col gap-3 max-w-md">
          {pwError && (
            <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/30
                            border border-red-200 dark:border-red-800/50
                            text-[13px] font-medium text-red-600 dark:text-red-400">
              {pwError}
            </div>
          )}
          <PasswordField label="Current password" value={pw.current} onChange={v => setPw(p => ({ ...p, current: v }))} placeholder="Your current password" />
          <PasswordField label="New password" value={pw.newP} onChange={v => setPw(p => ({ ...p, newP: v }))} placeholder="Min. 8 characters" />
          <PasswordField label="Confirm new password" value={pw.confirm} onChange={v => setPw(p => ({ ...p, confirm: v }))} placeholder="Re-enter new password" />
          <div className="flex justify-start mt-1">
            <SaveButton loading={pwLoading} saved={pwSaved} />
          </div>
        </form>
      </Section>

      {/* Sessions */}
      <Section title="Active Sessions" description="Devices currently logged into your account.">
        <div className="flex flex-col gap-2">
          {[
            { device: "Chrome on macOS", location: "Tiruchirappalli, India", current: true, last: "Right now" },
            { device: "Safari on iPhone", location: "Tiruchirappalli, India", current: false, last: "2 hours ago" },
            { device: "Firefox on Windows", location: "Mumbai, India", current: false, last: "3 days ago" },
          ].map((s, i) => (
            <div key={i} className="flex items-center justify-between gap-3 p-3.5 rounded-xl
                                    bg-muted/30 border border-border">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-semibold text-foreground">{s.device}</p>
                  {s.current && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full
                                     bg-teal-100/80 dark:bg-teal-950/50
                                     text-teal-700 dark:text-teal-400
                                     border border-teal-200/70 dark:border-teal-800/60">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-[11.5px] text-muted-foreground">{s.location} · {s.last}</p>
              </div>
              {!s.current && (
                <button className="text-[12.5px] font-semibold text-red-500 dark:text-red-400
                                   hover:text-red-600 dark:hover:text-red-300 transition-colors">
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
        <button className="mt-4 text-[13px] font-semibold text-red-500 dark:text-red-400
                           hover:text-red-600 dark:hover:text-red-300 transition-colors
                           flex items-center gap-1.5">
          <RiLogoutBoxLine /> Sign out of all other sessions
        </button>
      </Section>
    </div>
  );
}

// ─── TAB: Danger Zone ──────────────────────────────────────
function DangerTab() {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  return (
    <div className="flex flex-col gap-5">
      {/* Export data */}
      <Section title="Export Your Data" description="Download a full copy of your Nexora data.">
        <p className="text-[13.5px] text-muted-foreground leading-relaxed mb-4">
          Your export will include all clusters, sessions, resources, tasks, member lists,
          certificates, and activity logs in JSON and CSV format.
          The file will be emailed to your registered address within 24 hours.
        </p>
        <button className="inline-flex items-center gap-2 h-10 px-5 rounded-xl
                           border border-border bg-muted/50 hover:bg-muted
                           text-[13.5px] font-semibold text-foreground/80 hover:text-foreground
                           transition-all duration-150">
          <RiDownloadLine /> Request data export
        </button>
      </Section>

      {/* Deactivate */}
      <Section title="Deactivate Account" description="Temporarily disable your account. You can reactivate later.">
        <p className="text-[13.5px] text-muted-foreground leading-relaxed mb-4">
          Deactivating hides your profile and suspends all cluster notifications.
          Your data is preserved. You can reactivate by logging back in at any time.
        </p>
        <button className="inline-flex items-center gap-2 h-10 px-5 rounded-xl
                           border border-amber-300/70 dark:border-amber-700/50
                           bg-amber-50/60 dark:bg-amber-950/20
                           text-[13.5px] font-semibold
                           text-amber-700 dark:text-amber-400
                           hover:bg-amber-100/60 dark:hover:bg-amber-950/40
                           transition-all duration-150">
          Deactivate my account
        </button>
      </Section>

      {/* Delete */}
      <div className="rounded-2xl border border-red-200/70 dark:border-red-900/50 bg-card overflow-hidden">
        <div className="px-6 py-4 border-b border-red-200/70 dark:border-red-900/50">
          <h3 className="text-[14.5px] font-bold text-red-600 dark:text-red-400 leading-none mb-0.5">
            Delete Account
          </h3>
          <p className="text-[12.5px] text-muted-foreground">This action is permanent and cannot be undone.</p>
        </div>
        <div className="px-6 py-5">
          {!confirmDelete ? (
            <>
              <p className="text-[13.5px] text-muted-foreground leading-relaxed mb-4">
                Permanently deletes your account, all clusters, sessions, resources, members,
                and certificates. This cannot be reversed. Active members will lose access immediately.
              </p>
              <button
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center gap-2 h-10 px-5 rounded-xl
                           bg-red-50 dark:bg-red-950/30
                           border border-red-200/70 dark:border-red-800/50
                           text-[13.5px] font-bold text-red-600 dark:text-red-400
                           hover:bg-red-100 dark:hover:bg-red-950/50
                           transition-all duration-150">
                <RiDeleteBinLine /> Delete my account
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/30
                              border border-red-200 dark:border-red-800/50">
                <p className="text-[13px] font-semibold text-red-600 dark:text-red-400 mb-1">
                  ⚠ This will permanently delete everything.
                </p>
                <p className="text-[12.5px] text-red-500/80 dark:text-red-400/70 leading-relaxed">
                  All clusters, sessions, member data, and certificates will be gone forever.
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
                  className="h-10 px-5 rounded-xl border border-border bg-muted/50 hover:bg-muted
                             text-[13px] font-semibold text-muted-foreground hover:text-foreground transition-all">
                  Cancel
                </button>
                <button
                  disabled={confirmText !== "DELETE"}
                  className="inline-flex items-center gap-2 h-10 px-5 rounded-xl
                             text-[13px] font-bold text-white
                             bg-red-600 hover:bg-red-700 disabled:bg-muted
                             disabled:text-muted-foreground disabled:cursor-not-allowed
                             shadow-sm shadow-red-600/20 disabled:shadow-none
                             transition-all duration-150">
                  <RiDeleteBinLine /> Permanently delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────
export default function AccountSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("profile");

  return (
    <div className="p-5 lg:p-7 pt-6 max-w-5xl mx-auto w-full">


      {/* ── Page ── */}
      <div className="flex flex-1 flex-col gap-6 p-5 lg:p-7 pt-6">

        {/* Page title */}
        <div>
          <h1 className="text-[1.4rem] font-extrabold tracking-tight text-foreground leading-none mb-0.5">
            Account Settings
          </h1>
          <p className="text-[13px] text-muted-foreground">
            Manage your profile, notifications, privacy, and account security.
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
                // Danger tab — red tint when active
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
          {activeTab === "profile" && <ProfileTab />}
          {activeTab === "notifications" && <NotificationsTab />}
          {activeTab === "privacy" && <PrivacyTab />}
          {activeTab === "danger" && <DangerTab />}
        </div>

      </div>
    </div>
  );
}