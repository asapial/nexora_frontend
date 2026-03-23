"use client";

import { useState, useMemo } from "react";
import { RiSparklingFill, RiArrowRightLine, RiAddLine } from "react-icons/ri";
import { cn } from "@/lib/utils";
import SectionContainer from "@/utils/SectionContainer";

// ─── Types ────────────────────────────────────────────────
export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface FaqSectionData {
  eyebrow?: string;
  headline: string;
  subtext: string;
  contactText?: string;
  contactLink?: string;
}

// ─── Category colour map ──────────────────────────────────
const CATEGORY_COLORS: Record<string, { pill: string; tag: string }> = {
  "Getting Started": {
    pill: "bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border-teal-200/60 dark:border-teal-800/50",
    tag:  "bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400",
  },
  "Features": {
    pill: "bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 border-violet-200/60 dark:border-violet-800/50",
    tag:  "bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-400",
  },
  "Pricing": {
    pill: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/50",
    tag:  "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400",
  },
  "Technical": {
    pill: "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-200/60 dark:border-sky-800/50",
    tag:  "bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-400",
  },
};

function getCategoryStyle(cat: string) {
  return (
    CATEGORY_COLORS[cat] ?? {
      pill: "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700",
      tag:  "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400",
    }
  );
}

// ─── Default data ──────────────────────────────────────────
const DEFAULT_DATA: FaqSectionData = {
  eyebrow: "FAQ",
  headline: "Got questions?",
  subtext:
    "Everything you need to know about Nexora. Can't find the answer? Our team is ready to help.",
  contactText: "Ask our team",
  contactLink: "#contact",
};

const DEFAULT_ITEMS: FaqItem[] = [
  {
    id: "f1",
    question: "How do I create my first cluster?",
    answer:
      "After signing up as a Teacher, click \"New Cluster\" from your dashboard. Give it a name, optional batch tag, and add member emails. Nexora auto-generates one-time credentials and emails them to every new member instantly.",
    category: "Getting Started",
  },
  {
    id: "f2",
    question: "Do students need to register before I add them?",
    answer:
      "No. You just enter their emails. Nexora creates the account, generates a one-time password, and emails login credentials automatically. Students change their password on first login.",
    category: "Getting Started",
  },
  {
    id: "f3",
    question: "What happens when I create a session?",
    answer:
      "A Task record is automatically created for every RUNNING member in the cluster. Email and in-app notifications are sent. Members can submit text or file attachments before the deadline you set.",
    category: "Features",
  },
  {
    id: "f4",
    question: "How does the cluster health score work?",
    answer:
      "The health score (0–100) is auto-calculated from three factors: task submission rate, session attendance rate, and recent activity. A cron job recalculates it daily. Scores below 40 trigger an \"At Risk\" indicator.",
    category: "Features",
  },
  {
    id: "f5",
    question: "Can I give different access levels to co-teachers?",
    answer:
      "Yes. When adding a co-teacher to a cluster, you choose canEdit: true (full create/review access) or canEdit: false (observation-only). You can change or revoke access at any time.",
    category: "Features",
  },
  {
    id: "f6",
    question: "Is Nexora free to use?",
    answer:
      "Yes. The Free plan includes clusters, sessions, tasks, attendance, and resources with no time limit. Pro unlocks AI tools, advanced analytics, and higher storage limits. Enterprise adds multi-tenant organizations.",
    category: "Pricing",
  },
  {
    id: "f7",
    question: "How are paid courses handled?",
    answer:
      "Paid courses use Stripe Checkout. On successful payment the webhook activates the enrollment automatically. Admins can also manually enroll users from the admin dashboard — no payment required in that flow.",
    category: "Pricing",
  },
  {
    id: "f8",
    question: "What tech stack does Nexora run on?",
    answer:
      "Next.js 14 (App Router) + TypeScript frontend, Express + Prisma + PostgreSQL backend, Better Auth for sessions, Cloudinary for file storage, Stripe for payments, and OpenAI SDK for AI features.",
    category: "Technical",
  },
  {
    id: "f9",
    question: "Does Nexora support webhooks?",
    answer:
      "Yes. Admins can register outbound webhooks for any platform event (session.created, task.reviewed, member.added, payment.completed). Payloads are signed with HMAC-SHA256 and delivery logs are viewable in the dashboard.",
    category: "Technical",
  },
];

// ─── Accordion item ────────────────────────────────────────
function AccordionItem({
  item,
  isOpen,
  onToggle,
}: {
  item: FaqItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const style = getCategoryStyle(item.category);

  return (
    <div
      className={cn(
        "rounded-2xl border overflow-hidden",
        "transition-all duration-200",
        isOpen
          ? "border-teal-300/40 dark:border-teal-700/40 bg-white dark:bg-zinc-900"
          : "border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60"
      )}
    >
      {/* ── Question row ── */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left group"
        aria-expanded={isOpen}
      >
        <span
          className={cn(
            "text-[15.5px] font-semibold leading-snug",
            "text-zinc-800 dark:text-zinc-100",
            "group-hover:text-teal-700 dark:group-hover:text-teal-400",
            "transition-colors duration-150"
          )}
        >
          {item.question}
        </span>

        {/* Chevron */}
        <span
          className={cn(
            "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
            "text-sm font-bold transition-all duration-300",
            isOpen
              ? "bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 rotate-180"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500",
          )}
        >
          ▾
        </span>
      </button>

      {/* ── Answer panel ── */}
      <div
        className={cn(
          "grid transition-all duration-350 ease-in-out",
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="px-6 pb-5 border-t border-zinc-100 dark:border-zinc-800">
            {/* Category tag */}
            <span
              className={cn(
                "inline-flex items-center mt-4 mb-3 px-2.5 py-0.5 rounded-full",
                "text-[9.5px] font-bold tracking-widest uppercase",
                style.tag
              )}
            >
              {item.category}
            </span>
            <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              {item.answer}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Section ───────────────────────────────────────────────
export default function FaqSection({
  data = DEFAULT_DATA,
  items = DEFAULT_ITEMS,
}: {
  data?: FaqSectionData;
  items?: FaqItem[];
}) {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [openId, setOpenId] = useState<string | null>(null);

  // Unique sorted category list
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(items.map((i) => i.category)))],
    [items]
  );

  const filtered = useMemo(
    () =>
      activeCategory === "All"
        ? items
        : items.filter((i) => i.category === activeCategory),
    [items, activeCategory]
  );

  const handleToggle = (id: string) =>
    setOpenId((prev) => (prev === id ? null : id));

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setOpenId(null);
  };

  return (
    <SectionContainer className="relative py-24 lg:py-32 bg-zinc-50 dark:bg-zinc-950 overflow-hidden">

      {/* ── Teal grid background ── */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,0.025)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(20,184,166,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,0.03)_1px,transparent_1px)] bg-[size:72px_72px] pointer-events-none" />

      {/* ── Radial glow ── */}
      <div className="absolute top-0 left-0 right-0 h-96 bg-[radial-gradient(ellipse_60%_40%_at_30%_0%,rgba(20,184,166,0.06),transparent)] dark:bg-[radial-gradient(ellipse_60%_40%_at_30%_0%,rgba(20,184,166,0.09),transparent)] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-[280px_1fr] gap-14 lg:gap-20">

          {/* ── Left sticky header ── */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold border bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border-teal-200/60 dark:border-teal-800/60 mb-5">
              <RiSparklingFill className="animate-pulse text-base" />
              {data.eyebrow ?? "FAQ"}
            </div>

            {/* Headline */}
            <h2 className="text-[clamp(2rem,3.5vw,2.8rem)] font-bold tracking-tight leading-[1.1] text-zinc-900 dark:text-zinc-50 mb-4">
              {data.headline.split(" ").map((word, i) => (
                <span key={i}>
                  {i === 1 ? (
                    <span
                      style={{
                        background:
                          "linear-gradient(135deg,#0d9488 0%,#14b8a6 50%,#5eead4 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      {word}
                    </span>
                  ) : (
                    word
                  )}{" "}
                </span>
              ))}
            </h2>

            {/* Subtext */}
            <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400 mb-7">
              {data.subtext}
            </p>

            {/* Contact link */}
            {data.contactText && data.contactLink && (
              <a
                href={data.contactLink}
                className={cn(
                  "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl",
                  "bg-teal-50 dark:bg-teal-950/40",
                  "border border-teal-200/60 dark:border-teal-800/50",
                  "text-teal-700 dark:text-teal-400",
                  "text-sm font-semibold",
                  "hover:bg-teal-100 dark:hover:bg-teal-950/70",
                  "transition-colors duration-150"
                )}
              >
                {data.contactText}
                <RiArrowRightLine className="text-sm" />
              </a>
            )}

            {/* ── Category count pills (desktop) ── */}
            <div className="hidden lg:flex flex-col gap-2 mt-8 pt-8 border-t border-zinc-200 dark:border-zinc-800">
              {categories.map((cat) => {
                const count =
                  cat === "All"
                    ? items.length
                    : items.filter((i) => i.category === cat).length;
                const style = getCategoryStyle(cat);
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => handleCategoryChange(cat)}
                    className={cn(
                      "flex items-center justify-between w-full px-3.5 py-2 rounded-lg",
                      "text-sm font-medium transition-all duration-150",
                      isActive
                        ? "bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400"
                        : "text-zinc-500 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 hover:text-zinc-700 dark:hover:text-zinc-300"
                    )}
                  >
                    <span>{cat}</span>
                    <span
                      className={cn(
                        "text-[11px] font-bold px-1.5 py-0.5 rounded-md",
                        isActive
                          ? "bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-500"
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Right accordion column ── */}
          <div>
            {/* Mobile category pills */}
            <div className="flex lg:hidden flex-wrap gap-2 mb-6">
              {categories.map((cat) => {
                const style = getCategoryStyle(cat);
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => handleCategoryChange(cat)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-full text-xs font-bold border",
                      "transition-all duration-150",
                      isActive
                        ? "bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400 border-teal-300/60 dark:border-teal-700/50"
                        : "bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-500 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                    )}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Accordion list */}
            <div className="flex flex-col gap-3">
              {filtered.map((item) => (
                <AccordionItem
                  key={item.id}
                  item={item}
                  isOpen={openId === item.id}
                  onToggle={() => handleToggle(item.id)}
                />
              ))}

              {filtered.length === 0 && (
                <div className="text-center py-14 text-zinc-400 dark:text-zinc-600">
                  <p className="text-base font-medium">No questions in this category yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </SectionContainer>
  );
}