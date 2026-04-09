"use client";

import {
  RiSparklingFill,
  RiArrowRightLine,
  RiGraduationCapLine,
  RiBookOpenLine,
} from "react-icons/ri";


// ─── Types ────────────────────────────────────────────────
export interface RoleCard {
  id: string;
  icon: React.ReactNode;
  badge: string;
  title: string;
  description: string;
  features: string[];
  /** Inline CSS gradient string — Tailwind can't interpolate arbitrary values */
  gradient: string;
  /** CSS rgba string used for box-shadow glow */
  glowColor: string;
  ctaText: string;
  ctaLink: string;
}

// ─── Gradient presets (index matches card index) ──────────
const ROLE_GRADIENTS: string[] = [
  "linear-gradient(135deg, #0f766e 0%, #0d9488 40%, #0891b2 100%)", // teal → sky
  "linear-gradient(135deg, #4c1d95 0%, #6d28d9 40%, #7c3aed 100%)", // purple → violet
];

// ─── Default data ──────────────────────────────────────────
const DEFAULT_ROLES: RoleCard[] = [
  {
    id: "teacher",
    icon: <RiGraduationCapLine className="text-[28px]" />,
    badge: "Teacher",
    title: "Lead. Teach.\nInspire growth.",
    description:
      "Create clusters, schedule sessions, review submissions, track progress, and build a learning ecosystem your members will genuinely love.",
    features: [
      "Create & manage clusters with health scores",
      "Schedule sessions & auto-assign tasks",
      "Review, score & give rubric feedback",
      "Upload resources & run resource quizzes",
      "View member radar-chart progress",
    ],
    gradient: "",             // overridden by ROLE_GRADIENTS[0]
    glowColor: "rgba(13,148,136,0.45)",
    ctaText: "Start teaching",
    ctaLink: "/apply-as-teacher",
  },
  {
    id: "student",
    icon: <RiBookOpenLine className="text-[28px]" />,
    badge: "Student",
    title: "Learn. Submit.\nEarn your badge.",
    description:
      "Join clusters, submit tasks, browse resources, track your own progress, and build a verified certificate portfolio that speaks for itself.",
    features: [
      "Access cluster sessions & resources",
      "Submit tasks & track deadlines",
      "AI study companion on any resource",
      "Earn milestone badges automatically",
      "Download & share PDF certificates",
    ],
    gradient: "",             // overridden by ROLE_GRADIENTS[1]
    glowColor: "rgba(109,40,217,0.45)",
    ctaText: "Join as Student",
    ctaLink: "/auth/signin",
  },
];

// ─── Single role card ──────────────────────────────────────
function RoleCardItem({ role, idx }: { role: RoleCard; idx: number }) {
  const gradient = ROLE_GRADIENTS[idx % ROLE_GRADIENTS.length];
  const glowBase   = `0 20px 60px -12px ${role.glowColor}`;
  const glowHover  = `0 28px 70px -10px ${role.glowColor.replace("0.45", "0.6")}`;

  return (
    <div
      className="relative rounded-3xl overflow-hidden p-9 transition-all duration-300 hover:-translate-y-2 cursor-default"
      style={{ background: gradient, boxShadow: glowBase }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.boxShadow = glowHover)
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.boxShadow = glowBase)
      }
    >
      {/* ── Decorative background rings ── */}
      <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full border border-white/10 pointer-events-none" />
      <div className="absolute -top-2  -right-2  w-24 h-24 rounded-full border border-white/[0.08] pointer-events-none" />
      <div className="absolute -bottom-12 right-8 w-36 h-36 rounded-full border border-white/[0.06] pointer-events-none" />

      {/* ── Icon box ── */}
      <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 text-white mb-5">
        {role.icon}
      </div>

      {/* ── Role badge ── */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white/90 text-xs font-bold tracking-widest uppercase mb-4">
        <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
        {role.badge}
      </div>

      {/* ── Title ── */}
      <h3 className="text-[22px] font-extrabold text-white leading-[1.2] tracking-tight mb-3 whitespace-pre-line">
        {role.title}
      </h3>

      {/* ── Description ── */}
      <p className="text-sm leading-relaxed text-white/75 mb-6">
        {role.description}
      </p>

      {/* ── Feature list ── */}
      <ul className="flex flex-col gap-2 mb-7">
        {role.features.map((feat) => (
          <li
            key={feat}
            className="flex items-center gap-2.5 text-sm text-white/85"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white/50 flex-shrink-0" />
            {feat}
          </li>
        ))}
      </ul>

      {/* ── CTA link ── */}
      <a
        href={role.ctaLink}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.18] backdrop-blur-sm border border-white/25 text-white text-sm font-bold transition-all duration-200 hover:bg-white/[0.28]"
      >
        {role.ctaText}
        <RiArrowRightLine className="text-base" />
      </a>
    </div>
  );
}

// ─── Section ───────────────────────────────────────────────
export default function RolesSection({
  roles = DEFAULT_ROLES,
}: {
  roles?: RoleCard[];
}) {
  return (
    <section className="relative py-24 lg:py-32 bg-zinc-50 dark:bg-zinc-950 overflow-hidden">

      {/* ── Subtle grid background ── */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(20,184,166,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,0.04)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Section header ── */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold border bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border-teal-200/60 dark:border-teal-800/60 mb-5">
            <RiSparklingFill className="animate-pulse" />
            Choose your path
          </div>

          <h2 className="text-[clamp(2rem,4vw,3rem)] font-bold tracking-tight leading-[1.1] text-zinc-900 dark:text-zinc-50 mb-4">
            One platform,{" "}
            <span
              style={{
                background:
                  "linear-gradient(135deg,#0d9488 0%,#14b8a6 50%,#5eead4 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              two powerful roles
            </span>
          </h2>

          <p className="text-zinc-500 dark:text-zinc-400 text-[clamp(1rem,1.8vw,1.15rem)] max-w-lg mx-auto leading-relaxed">
            Whether you lead or learn, Nexora adapts fully to how you work.
          </p>
        </div>

        {/* ── Cards grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {roles.map((role, idx) => (
            <RoleCardItem key={role.id} role={role} idx={idx} />
          ))}
        </div>
      </div>
    </section>
  );
}