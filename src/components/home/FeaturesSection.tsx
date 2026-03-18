"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  UniqueIdentifier,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  RiGroupLine,
  RiCalendarCheckLine,
  RiFileTextLine,
  RiBarChartBoxLine,
  RiGraduationCapLine,
  RiRobot2Line,
  RiDraggable,
  RiSparklingFill,
} from "react-icons/ri";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────
interface FeatureCard {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  // Tailwind classes — fully customisable per card
  cardBg: string;         // card background (light + dark variants)
  accentColor: string;    // icon container + text accent
  iconBg: string;         // icon wrapper background
  borderColor: string;    // card border
  glowColor: string;      // hover glow shadow
  tagLabel: string;       // small corner tag
}

// ─── Default card data ────────────────────────────────────
const DEFAULT_CARDS: FeatureCard[] = [
  {
    id: "clusters",
    icon: <RiGroupLine className="text-[22px]" />,
    title: "Smart Clusters",
    description:
      "Create named groups, invite members by email, auto-generate one-time credentials, and track health scores — all from a single dashboard.",
    cardBg:
      "bg-white dark:bg-zinc-900",
    accentColor: "text-teal-600 dark:text-teal-400",
    iconBg:
      "bg-teal-50 dark:bg-teal-950/60",
    borderColor:
      "border-zinc-200/80 dark:border-zinc-800/80",
    glowColor:
      "hover:shadow-teal-500/10 dark:hover:shadow-teal-500/15",
    tagLabel: "Core",
  },
  {
    id: "sessions",
    icon: <RiCalendarCheckLine className="text-[22px]" />,
    title: "Scheduled Sessions",
    description:
      "Plan sessions with agendas, auto-create tasks per member, track attendance, collect structured feedback, and link post-session recordings.",
    cardBg:
      "bg-white dark:bg-zinc-900",
    accentColor: "text-violet-600 dark:text-violet-400",
    iconBg:
      "bg-violet-50 dark:bg-violet-950/50",
    borderColor:
      "border-zinc-200/80 dark:border-zinc-800/80",
    glowColor:
      "hover:shadow-violet-500/10 dark:hover:shadow-violet-500/15",
    tagLabel: "Productivity",
  },
  {
    id: "resources",
    icon: <RiFileTextLine className="text-[22px]" />,
    title: "Resource Library",
    description:
      "Upload papers, slides, and links. Gate downloads behind MCQ quizzes, allow threaded comments, pin top insights, and organize by category.",
    cardBg:
      "bg-white dark:bg-zinc-900",
    accentColor: "text-amber-600 dark:text-amber-400",
    iconBg:
      "bg-amber-50 dark:bg-amber-950/50",
    borderColor:
      "border-zinc-200/80 dark:border-zinc-800/80",
    glowColor:
      "hover:shadow-amber-500/10 dark:hover:shadow-amber-500/15",
    tagLabel: "Knowledge",
  },
  {
    id: "analytics",
    icon: <RiBarChartBoxLine className="text-[22px]" />,
    title: "Live Analytics",
    description:
      "Monitor submission rates, attendance trends, cluster health scores, and member progress — with radar charts and weekly digest emails.",
    cardBg:
      "bg-white dark:bg-zinc-900",
    accentColor: "text-emerald-600 dark:text-emerald-400",
    iconBg:
      "bg-emerald-50 dark:bg-emerald-950/50",
    borderColor:
      "border-zinc-200/80 dark:border-zinc-800/80",
    glowColor:
      "hover:shadow-emerald-500/10 dark:hover:shadow-emerald-500/15",
    tagLabel: "Insights",
  },
  {
    id: "courses",
    icon: <RiGraduationCapLine className="text-[22px]" />,
    title: "Courses & Certificates",
    description:
      "Publish free or Stripe-paid courses with modular lessons. Auto-generate branded PDF certificates with public verification URLs on completion.",
    cardBg:
      "bg-white dark:bg-zinc-900",
    accentColor: "text-sky-600 dark:text-sky-400",
    iconBg:
      "bg-sky-50 dark:bg-sky-950/50",
    borderColor:
      "border-zinc-200/80 dark:border-zinc-800/80",
    glowColor:
      "hover:shadow-sky-500/10 dark:hover:shadow-sky-500/15",
    tagLabel: "Learning",
  },
  {
    id: "ai",
    icon: <RiRobot2Line className="text-[22px]" />,
    title: "AI Study Companion",
    description:
      "RAG-powered chat over any uploaded resource. Get plain-language summaries, auto-generated practice questions, and smart grading suggestions.",
    cardBg:
      "bg-white dark:bg-zinc-900",
    accentColor: "text-rose-600 dark:text-rose-400",
    iconBg:
      "bg-rose-50 dark:bg-rose-950/50",
    borderColor:
      "border-zinc-200/80 dark:border-zinc-800/80",
    glowColor:
      "hover:shadow-rose-500/10 dark:hover:shadow-rose-500/15",
    tagLabel: "AI · New",
  },
];

// ─── Individual sortable card ─────────────────────────────
function FeatureCardItem({
  card,
  isDragging = false,
  isOverlay = false,
}: {
  card: FeatureCard;
  isDragging?: boolean;
  isOverlay?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: sortableDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        // Base card
        "relative group flex flex-col rounded-2xl border p-6",
        "transition-all duration-300 ease-out",
        // Background + border
        card.cardBg,
        card.borderColor,
        // Shadow
        "shadow-sm hover:shadow-xl",
        card.glowColor,
        // Drag state
        sortableDragging || isDragging
          ? "opacity-40 scale-[0.97] shadow-none cursor-grabbing"
          : "cursor-grab hover:cursor-grab",
        // Overlay (the ghost following cursor)
        isOverlay &&
          "opacity-100 scale-[1.03] shadow-2xl ring-2 ring-teal-500/30 cursor-grabbing rotate-[1deg]",
        // Hover lift
        !sortableDragging && !isDragging && !isOverlay && "hover:-translate-y-1"
      )}
    >
      {/* ── Drag handle indicator ── */}
      <div
        {...attributes}
        {...listeners}
        className={cn(
          "absolute top-3.5 right-3.5 p-1 rounded-md",
          "text-zinc-300 dark:text-zinc-700",
          "hover:text-zinc-400 dark:hover:text-zinc-500",
          "opacity-0 group-hover:opacity-100",
          "transition-opacity duration-200",
          "cursor-grab active:cursor-grabbing",
          "touch-none"
        )}
        title="Drag to reorder"
      >
        <RiDraggable className="text-lg" />
      </div>

      {/* ── Tag label ── */}
      <div className="absolute top-4 left-6">
        <span
          className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-full",
            "text-[10px] font-bold tracking-widest uppercase",
            card.accentColor,
            card.iconBg
          )}
        >
          {card.tagLabel}
        </span>
      </div>

      {/* ── Icon ── */}
      <div
        className={cn(
          "flex items-center justify-center w-12 h-12 rounded-xl mt-8 mb-5",
          card.iconBg,
          card.accentColor,
          "transition-transform duration-300 group-hover:scale-110"
        )}
      >
        {card.icon}
      </div>

      {/* ── Title ── */}
      <h3
        className={cn(
          "text-[17px] font-bold tracking-tight mb-2.5",
          "text-zinc-900 dark:text-zinc-50"
        )}
      >
        {card.title}
      </h3>

      {/* ── Description ── */}
      <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400 flex-1">
        {card.description}
      </p>

      {/* ── Bottom accent line ── */}
      <div
        className={cn(
          "absolute bottom-0 left-6 right-6 h-px rounded-full",
          "opacity-0 group-hover:opacity-100",
          "transition-opacity duration-300",
          // Coloured underline using accent
          card.accentColor
            .replace("text-", "bg-")
            .replace(" dark:text-", " dark:bg-")
        )}
      />

      {/* ── Subtle corner glow ── */}
      <div
        className={cn(
          "absolute -bottom-px -right-px w-24 h-24 rounded-br-2xl",
          "opacity-0 group-hover:opacity-100",
          "transition-opacity duration-500",
          "pointer-events-none",
          // Radial corner tint
          "bg-[radial-gradient(circle_at_100%_100%,var(--glow),transparent_70%)]"
        )}
        style={
          {
            "--glow": card.accentColor.includes("teal")
              ? "rgba(20,184,166,0.07)"
              : card.accentColor.includes("violet")
              ? "rgba(139,92,246,0.07)"
              : card.accentColor.includes("amber")
              ? "rgba(245,158,11,0.07)"
              : card.accentColor.includes("emerald")
              ? "rgba(16,185,129,0.07)"
              : card.accentColor.includes("sky")
              ? "rgba(14,165,233,0.07)"
              : "rgba(244,63,94,0.07)",
          } as React.CSSProperties
        }
      />
    </div>
  );
}

// ─── Section header ───────────────────────────────────────
function SectionHeader() {
  return (
    <div className="text-center mb-16 space-y-4">
      {/* Eyebrow */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold border bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border-teal-200/60 dark:border-teal-800/60">
        <RiSparklingFill className="text-teal-500 dark:text-teal-400 animate-pulse" />
        Everything you need
      </div>

      {/* Headline */}
      <h2 className="text-[clamp(2rem,4vw,3rem)] font-bold tracking-tight leading-[1.1] text-zinc-900 dark:text-zinc-50">
        One platform.{" "}
        <span className="relative inline-block">
          <span
            className="relative z-10"
            style={{
              background:
                "linear-gradient(135deg, #0d9488 0%, #14b8a6 50%, #5eead4 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Every tool.
          </span>
          {/* Underline squiggle */}
          <svg
            className="absolute -bottom-1 left-0 w-full"
            viewBox="0 0 200 8"
            fill="none"
            preserveAspectRatio="none"
            height="6"
          >
            <path
              d="M0 6 Q50 0 100 4 Q150 8 200 2"
              stroke="url(#teal-grad)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="teal-grad" x1="0" y1="0" x2="200" y2="0">
                <stop offset="0%" stopColor="#0d9488" />
                <stop offset="100%" stopColor="#5eead4" />
              </linearGradient>
            </defs>
          </svg>
        </span>
      </h2>

      {/* Sub */}
      <p className="text-[clamp(1rem,1.8vw,1.15rem)] text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
        Nexora combines cluster management, session planning, resource sharing,
        analytics, and AI tools — so teachers and members can focus on what matters.
      </p>

      {/* Drag hint */}
      <p className="inline-flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-600 mt-2">
        <RiDraggable className="text-sm" />
        Drag cards to reorder your priorities
      </p>
    </div>
  );
}

// ─── Main FeaturesSection ─────────────────────────────────
export default function FeaturesSection() {
  const [cards, setCards] = useState<FeatureCard[]>(DEFAULT_CARDS);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        // Require 6px movement before drag starts — prevents accidental drags
        distance: 6,
      },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      if (over && active.id !== over.id) {
        setCards((prev) => {
          const oldIndex = prev.findIndex((c) => c.id === active.id);
          const newIndex = prev.findIndex((c) => c.id === over.id);
          return arrayMove(prev, oldIndex, newIndex);
        });
      }
    },
    []
  );

  const activeCard = cards.find((c) => c.id === activeId) ?? null;

  return (
    <section className="relative py-24 lg:py-32 bg-zinc-50 dark:bg-zinc-950 overflow-hidden">

      {/* ── Background texture ── */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_40%_at_50%_0%,rgba(20,184,166,0.05),transparent)] dark:bg-[radial-gradient(ellipse_70%_40%_at_50%_0%,rgba(20,184,166,0.08),transparent)] pointer-events-none" />

      {/* Subtle grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,0.03)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none dark:bg-[linear-gradient(rgba(20,184,166,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,0.04)_1px,transparent_1px)]" />

      {/* ── Container ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <SectionHeader />

        {/* ── DnD Grid ── */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={cards.map((c) => c.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {cards.map((card) => (
                <FeatureCardItem
                  key={card.id}
                  card={card}
                  isDragging={activeId === card.id}
                />
              ))}
            </div>
          </SortableContext>

          {/* DragOverlay — renders the card that follows the cursor */}
          <DragOverlay dropAnimation={null}>
            {activeCard ? (
              <FeatureCardItem card={activeCard} isOverlay />
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* ── Bottom CTA strip ── */}
        <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            All features available on the free plan.{" "}
            <span className="text-zinc-400 dark:text-zinc-600">
              Pro unlocks AI tools and advanced analytics.
            </span>
          </p>
          <a
            href="#pricing"
            className={cn(
              "inline-flex items-center gap-1.5 text-sm font-semibold",
              "text-teal-600 dark:text-teal-400",
              "hover:text-teal-700 dark:hover:text-teal-300",
              "transition-colors duration-150",
              "underline-offset-4 hover:underline"
            )}
          >
            See all plans →
          </a>
        </div>
      </div>
    </section>
  );
}