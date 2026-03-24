"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { RiSparklingFill, RiCheckLine, RiCloseLine, RiArrowRightLine, RiQuestionLine } from "react-icons/ri";
import { cn } from "@/lib/utils";

// ─── Plan data ────────────────────────────────────────────
const PLANS = [
  {
    id: "free",
    name: "Free",
    badge: null,
    monthly: 0,
    annual: 0,
    description: "Perfect for individual teachers and small groups getting started.",
    cta: "Get started free",
    ctaHref: "/register",
    ctaVariant: "outline" as const,
    features: [
      "Up to 3 clusters",
      "Up to 20 members per cluster",
      "Unlimited sessions & tasks",
      "Resource library (1 GB)",
      "Basic analytics",
      "Email notifications",
      "Community support",
    ],
    notIncluded: ["AI Study Companion", "Advanced analytics", "Custom rubrics", "Priority support", "Multi-tenant orgs"],
  },
  {
    id: "pro",
    name: "Pro",
    badge: "Most Popular",
    monthly: 19,
    annual: 15,
    description: "For active teachers and research teams who need the full toolkit.",
    cta: "Start Pro free for 14 days",
    ctaHref: "/register?plan=pro",
    ctaVariant: "primary" as const,
    features: [
      "Unlimited clusters",
      "Unlimited members",
      "Unlimited sessions & tasks",
      "Resource library (50 GB)",
      "AI Study Companion",
      "Advanced analytics & radar charts",
      "Custom grading rubrics",
      "Session Replay Archive",
      "Peer review assignments",
      "Priority email support",
    ],
    notIncluded: ["Multi-tenant organizations", "Dedicated account manager"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    badge: null,
    monthly: null,
    annual: null,
    description: "For universities and companies that need custom scale and branding.",
    cta: "Contact us",
    ctaHref: "/contact",
    ctaVariant: "outline" as const,
    features: [
      "Everything in Pro",
      "Multi-tenant organizations",
      "Custom branding & domain",
      "Unlimited storage",
      "SSO / SAML integration",
      "Audit logs & compliance exports",
      "SLA uptime guarantee",
      "Dedicated account manager",
      "Custom onboarding flow",
      "Priority phone & Slack support",
    ],
    notIncluded: [],
  },
];

const FAQ_ITEMS = [
  { q: "Can I change plans later?",   a: "Yes — upgrade or downgrade any time. Changes take effect at the start of your next billing period." },
  { q: "Is there a free trial for Pro?", a: "Pro comes with a 14-day free trial — no credit card required to start." },
  { q: "What counts as a 'member'?",  a: "A member is any student added to at least one of your clusters. The same person across multiple clusters counts once." },
  { q: "Do you offer academic discounts?", a: "Yes. Verified teachers at accredited institutions get 40% off Pro. Email us with your institutional address." },
  { q: "How does billing work for annual plans?", a: "Annual plans are billed once per year and save you up to 20% compared to monthly." },
];

function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const hero  = useReveal(0.1);
  const plans = useReveal(0.08);
  const faq   = useReveal(0.1);

  return (
    <main className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-28 pb-16 lg:pt-36 lg:pb-20">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,0.03)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(20,184,166,0.07),transparent)] pointer-events-none" />
        <div
          ref={hero.ref}
          className={cn(
            "relative z-10 max-w-3xl mx-auto px-4 text-center",
            "transition-[opacity,transform] duration-700",
            hero.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold border bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border-teal-200/60 dark:border-teal-800/60 mb-5">
            <RiSparklingFill className="animate-pulse" /> Pricing
          </div>
          <h1 className="text-[clamp(2.2rem,5vw,3.6rem)] font-extrabold tracking-tight leading-[1.08] mb-5">
            Simple, honest pricing
          </h1>
          <p className="text-[clamp(1rem,1.8vw,1.15rem)] text-zinc-500 dark:text-zinc-400 leading-relaxed mb-8">
            Start free forever. Upgrade when you need more power. No hidden fees, no per-member charges on paid plans.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-3 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
            <button onClick={() => setAnnual(false)} className={cn("px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150", !annual ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm" : "text-zinc-500 dark:text-zinc-500")}>
              Monthly
            </button>
            <button onClick={() => setAnnual(true)} className={cn("px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 flex items-center gap-2", annual ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm" : "text-zinc-500 dark:text-zinc-500")}>
              Annual
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400">Save 20%</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── PLAN CARDS ────────────────────────────────────── */}
      <section className="pb-24 lg:pb-32 px-4 sm:px-6">
        <div
          ref={plans.ref}
          className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5"
        >
          {PLANS.map((plan, i) => {
            const price = annual ? plan.annual : plan.monthly;
            const isPro = plan.id === "pro";
            return (
              <div
                key={plan.id}
                className={cn(
                  "relative flex flex-col rounded-3xl border overflow-hidden",
                  "transition-[opacity,transform] duration-700",
                  isPro
                    ? "border-teal-400/50 dark:border-teal-600/50 shadow-2xl shadow-teal-500/10 dark:shadow-teal-500/15 bg-white dark:bg-zinc-900"
                    : "border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60",
                  plans.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                )}
                style={{ transitionDelay: plans.visible ? `${i * 100}ms` : "0ms" }}
              >
                {/* Top bar */}
                {isPro && <div className="h-1 bg-gradient-to-r from-teal-600 via-teal-400 to-teal-300" />}

                {/* Popular badge */}
                {plan.badge && (
                  <div className="absolute top-5 right-5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200/60 dark:border-teal-800/60 text-[10.5px] font-extrabold tracking-wider uppercase text-teal-700 dark:text-teal-400">
                    {plan.badge}
                  </div>
                )}

                <div className="flex-1 p-7 flex flex-col">
                  <h3 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-50 mb-1">{plan.name}</h3>
                  <p className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed mb-6">{plan.description}</p>

                  {/* Price */}
                  <div className="mb-7">
                    {price === null ? (
                      <div className="text-[2.2rem] font-extrabold text-zinc-900 dark:text-zinc-50 leading-none">Custom</div>
                    ) : (
                      <div className="flex items-end gap-1">
                        <span className="text-[2.4rem] font-extrabold text-zinc-900 dark:text-zinc-50 leading-none">${price}</span>
                        {price > 0 && <span className="text-zinc-400 dark:text-zinc-500 text-sm mb-1.5">/ mo</span>}
                        {price === 0 && <span className="text-zinc-400 dark:text-zinc-500 text-sm mb-1.5">forever</span>}
                      </div>
                    )}
                    {annual && plan.monthly && plan.annual && plan.monthly !== plan.annual && (
                      <p className="text-[12px] text-teal-600 dark:text-teal-400 font-semibold mt-1">
                        Billed ${plan.annual * 12}/year — save ${(plan.monthly - plan.annual) * 12}
                      </p>
                    )}
                  </div>

                  {/* CTA */}
                  <Link
                    href={plan.ctaHref}
                    className={cn(
                      "flex items-center justify-center gap-2 h-11 rounded-xl text-[14px] font-bold mb-8 transition-all duration-200 hover:scale-[1.02]",
                      plan.ctaVariant === "primary"
                        ? "bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white shadow-md shadow-teal-600/20"
                        : "border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-teal-400 dark:hover:border-teal-600 hover:text-teal-700 dark:hover:text-teal-400"
                    )}
                  >
                    {plan.cta} <RiArrowRightLine />
                  </Link>

                  {/* Features */}
                  <ul className="flex flex-col gap-2.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-[13.5px] text-zinc-700 dark:text-zinc-300">
                        <RiCheckLine className="text-teal-600 dark:text-teal-400 text-base flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                    {plan.notIncluded.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-[13.5px] text-zinc-400 dark:text-zinc-600">
                        <RiCloseLine className="text-zinc-300 dark:text-zinc-700 text-base flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────── */}
      <section className="pb-24 lg:pb-32 px-4 sm:px-6 border-t border-zinc-100 dark:border-zinc-800/60">
        <div
          ref={faq.ref}
          className={cn(
            "max-w-2xl mx-auto pt-20 transition-[opacity,transform] duration-700",
            faq.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold border bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border-teal-200/60 dark:border-teal-800/60 mb-4">
              <RiQuestionLine /> Frequently asked
            </div>
            <h2 className="text-[clamp(1.6rem,3vw,2.2rem)] font-extrabold tracking-tight">Pricing questions</h2>
          </div>
          <div className="flex flex-col gap-3">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-[14.5px] font-semibold text-zinc-800 dark:text-zinc-200">{item.q}</span>
                  <span className={cn("text-zinc-400 dark:text-zinc-600 text-lg flex-shrink-0 transition-transform duration-200", openFaq === i && "rotate-180")}>▾</span>
                </button>
                <div className={cn("grid transition-all duration-300", openFaq === i ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                  <div className="overflow-hidden">
                    <p className="px-5 pb-4 text-[13.5px] text-zinc-500 dark:text-zinc-400 leading-relaxed border-t border-zinc-100 dark:border-zinc-800 pt-3">
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}