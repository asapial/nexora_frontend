"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  RiBuildingLine, RiArrowRightLine, RiCheckLine, RiCloseLine, RiSparklingFill,
  RiOrganizationChart, RiShieldCheckLine, RiBarChartBoxLine,
  RiGraduationCapLine, RiGroupLine, RiSettings3Line, RiFileTextLine, RiGlobalLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";

function useReveal(t = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setV(true); }, { threshold: t });
    obs.observe(el); return () => obs.disconnect();
  }, [t]);
  return { ref, v };
}

function TealText({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ background:"linear-gradient(135deg,#0d9488 0%,#14b8a6 50%,#5eead4 100%)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
      {children}
    </span>
  );
}

const COMPARISON = [
  { feature: "Max clusters",           free: "3",            pro: "Unlimited",     ent: "Unlimited"  },
  { feature: "Max members/cluster",    free: "20",           pro: "Unlimited",     ent: "Unlimited"  },
  { feature: "Multi-tenant org",       free: false,          pro: false,           ent: true         },
  { feature: "Custom branding",        free: false,          pro: false,           ent: true         },
  { feature: "Institution admin role", free: false,          pro: false,           ent: true         },
  { feature: "Audit logs",             free: false,          pro: false,           ent: true         },
  { feature: "AI Study Companion",     free: false,          pro: true,            ent: true         },
  { feature: "Advanced analytics",     free: false,          pro: true,            ent: true         },
  { feature: "Mass certificates",      free: "Manual only",  pro: "Automated",     ent: "Automated"  },
  { feature: "SSO / SAML",             free: false,          pro: false,           ent: true         },
  { feature: "SLA uptime guarantee",   free: false,          pro: false,           ent: "99.9%"      },
  { feature: "Dedicated account mgr",  free: false,          pro: false,           ent: true         },
];

function CellValue({ val }: { val: string | boolean }) {
  if (val === true)  return <RiCheckLine className="text-teal-600 dark:text-teal-400 text-lg" />;
  if (val === false) return <RiCloseLine className="text-muted-foreground/40 text-lg" />;
  return <span className="text-[13px] font-semibold text-foreground">{val}</span>;
}

export default function UniversitiesPage() {
  const r1 = useReveal(0.06); const r2 = useReveal(0.06);
  const r3 = useReveal(0.08); const r4 = useReveal(0.08); const r5 = useReveal(0.1);

  return (
    <main className="overflow-x-hidden bg-background text-foreground">

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section className="relative pt-28 pb-20 overflow-hidden bg-zinc-950 dark:bg-zinc-950">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,.03)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-700 via-teal-500 to-teal-400" />
        {/* Concentric rings — institutional seal motif */}
        <div className="absolute right-[-80px] top-1/2 -translate-y-1/2 w-[560px] h-[560px] rounded-full border border-teal-800/[0.15] pointer-events-none hidden lg:block" />
        <div className="absolute right-[40px] top-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full border border-teal-700/[0.12] pointer-events-none hidden lg:block" />
        <div className="absolute right-[120px] top-1/2 -translate-y-1/2 w-[280px] h-[280px] rounded-full border border-teal-600/[0.1] pointer-events-none hidden lg:block" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_75%_50%,rgba(20,184,166,.05),transparent)] pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-14 h-14 rounded-2xl bg-teal-500/12 border border-teal-500/25
                            flex items-center justify-center text-teal-400 text-2xl">
              <RiBuildingLine />
            </div>
            <div>
              <p className="text-[10px] font-black tracking-[.22em] uppercase text-teal-400">Use case</p>
              <p className="text-[16px] font-bold text-zinc-300">Universities</p>
            </div>
          </div>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
                            bg-teal-500/10 border border-teal-500/25
                            text-teal-400 text-[11px] font-bold tracking-[.08em] uppercase mb-7">
              <RiSparklingFill className="animate-pulse" />
              Enterprise · Multi-tenant
            </div>

            <h1 className="text-[clamp(2.8rem,6.5vw,5.5rem)] font-black leading-[.95]
                           tracking-[-0.035em] text-white mb-7">
              The academic platform<br />built for{" "}
              <TealText>institutional scale.</TealText>
            </h1>

            <p className="text-[16px] text-zinc-300 leading-[1.75] max-w-[560px] mb-10">
              Nexora's Enterprise tier gives universities a multi-tenant platform where every
              department, seminar, and research group operates independently — under one
              institution-wide roof with full admin oversight and branded certification.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link href="/contact"
                className="inline-flex items-center gap-2 h-12 px-7 rounded-xl
                           bg-teal-600 hover:bg-teal-700 text-white font-bold text-[15px]
                           shadow-lg shadow-teal-900/40
                           transition-all duration-200 hover:scale-[1.02]">
                Request a demo <RiArrowRightLine />
              </Link>
              <Link href="/pricing"
                className="inline-flex items-center gap-2 h-12 px-7 rounded-xl
                           border border-white/15 hover:border-teal-500/50
                           text-zinc-300 hover:text-teal-300
                           font-semibold text-[15px] transition-all duration-200">
                View Enterprise plan
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          STATS BAND
      ══════════════════════════════════════════ */}
      <div className="border-y border-border bg-muted/40">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 divide-x divide-border">
          {[["60+","Countries with active university users"],["240","Avg members per university org"],["99.9%","Platform uptime SLA on Enterprise"],["GDPR","Fully compliant — EU & UK"]].map(([v, l], i) => (
            <div key={i} className="flex flex-col items-center py-10 px-4 text-center">
              <p className="text-[2.2rem] font-black text-teal-600 dark:text-teal-400 tabular-nums leading-none mb-1.5">{v}</p>
              <p className="text-[11.5px] font-semibold text-muted-foreground">{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          INSTITUTIONAL CHALLENGES — editorial rows
      ══════════════════════════════════════════ */}
      <section className="py-24 lg:py-32 bg-background">
        <div ref={r1.ref}
          className={cn("max-w-6xl mx-auto px-6 sm:px-10 lg:px-16 transition-[opacity,transform] duration-700",
            r1.v ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10")}>
          <div className="grid lg:grid-cols-[260px_1fr] gap-12 lg:gap-20 items-start">
            <div className="lg:sticky lg:top-24">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full
                              bg-teal-50 dark:bg-teal-950/40
                              border border-teal-200/60 dark:border-teal-800/60
                              text-teal-700 dark:text-teal-400
                              text-[11px] font-bold tracking-[.08em] uppercase mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                The challenge
              </div>
              <h2 className="text-[clamp(1.6rem,2.8vw,2.2rem)] font-extrabold leading-[1.15] tracking-tight text-foreground">
                University-scale coordination is broken.
              </h2>
            </div>

            <div className="flex flex-col divide-y divide-border">
              {[["Shadow IT risk","Each department runs a different mix of tools — WhatsApp, Notion, Google Drive. IT can't sanction every lecturer's personal choices, creating data and compliance risk."],
                ["Invisible student engagement","Faculty have no visibility into engagement across modules until the end-of-term grade sheet. Interventions always come too late."],
                ["Manual certificate bottleneck","Generating verified academic certificates for thousands of students per cohort is a manual administrative bottleneck every single semester."],
                ["Lost institutional memory","When a research supervisor leaves, their group's history, tasks, and resources disappear with them. The institution has nothing."],
              ].map(([title, body], i) => (
                <div key={i}
                  className={cn("py-7 flex gap-5 transition-[opacity,transform] duration-500",
                    r1.v ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-6")}
                  style={{ transitionDelay: r1.v ? `${i * 80}ms` : "0ms" }}>
                  <span className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-950/30
                                   border border-red-200/60 dark:border-red-800/40
                                   flex items-center justify-center flex-shrink-0 mt-1">
                    <RiCloseLine className="text-red-400 text-sm" />
                  </span>
                  <div>
                    <h3 className="text-[16px] font-bold text-foreground mb-1.5">{title}</h3>
                    <p className="text-[14px] text-muted-foreground leading-relaxed">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FEATURE COMPARISON TABLE
      ══════════════════════════════════════════ */}
      <section className="py-24 lg:py-32 bg-muted/30">
        <div ref={r2.ref}
          className={cn("max-w-5xl mx-auto px-6 sm:px-10 lg:px-16 transition-[opacity,transform] duration-700",
            r2.v ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
                            bg-teal-50 dark:bg-teal-950/40
                            border border-teal-200/60 dark:border-teal-800/60
                            text-teal-700 dark:text-teal-400
                            text-[11.5px] font-bold tracking-[.06em] uppercase mb-5">
              <RiSparklingFill className="animate-pulse" /> Plan comparison
            </div>
            <h2 className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-extrabold tracking-tight leading-[1.1] text-foreground mb-3">
              Why universities choose Enterprise
            </h2>
            <p className="text-muted-foreground text-[15.5px] max-w-xl">
              Every critical institutional feature — multi-tenancy, audit logs, SSO, custom branding — is Enterprise-only by design.
            </p>
          </div>

          <div className="rounded-3xl border border-border overflow-hidden shadow-lg shadow-black/[0.04] dark:shadow-black/20 bg-card">
            {/* Header */}
            <div className="grid grid-cols-[1fr_80px_80px_120px] border-b border-border bg-muted/60">
              <div className="px-6 py-4 text-[12px] font-bold text-muted-foreground uppercase tracking-wider">Feature</div>
              <div className="px-3 py-4 text-[12px] font-bold text-muted-foreground uppercase tracking-wider text-center">Free</div>
              <div className="px-3 py-4 text-[12px] font-bold text-muted-foreground uppercase tracking-wider text-center">Pro</div>
              <div className="px-4 py-4 text-[12px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider text-center
                              bg-teal-50/60 dark:bg-teal-950/20">Enterprise</div>
            </div>

            {COMPARISON.map((row, i) => (
              <div key={row.feature}
                className={cn(
                  "grid grid-cols-[1fr_80px_80px_120px] border-b border-border last:border-0 items-center",
                  i % 2 !== 0 && "bg-muted/20",
                  "transition-[opacity,transform] duration-400",
                  r2.v ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                )}
                style={{ transitionDelay: r2.v ? `${i * 30}ms` : "0ms" }}>
                <div className="px-6 py-3.5 text-[14px] font-semibold text-foreground">{row.feature}</div>
                <div className="px-3 py-3.5 flex justify-center"><CellValue val={row.free} /></div>
                <div className="px-3 py-3.5 flex justify-center"><CellValue val={row.pro} /></div>
                <div className="px-4 py-3.5 flex justify-center bg-teal-50/30 dark:bg-teal-950/10">
                  <CellValue val={row.ent} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          ENTERPRISE FEATURES
      ══════════════════════════════════════════ */}
      <section className="py-24 lg:py-32 bg-background">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
          <div ref={r3.ref}
            className={cn("mb-14 transition-[opacity,transform] duration-700",
              r3.v ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
                            bg-teal-50 dark:bg-teal-950/40
                            border border-teal-200/60 dark:border-teal-800/60
                            text-teal-700 dark:text-teal-400
                            text-[11.5px] font-bold tracking-[.06em] uppercase mb-5">
              <RiSparklingFill className="animate-pulse" /> Enterprise features
            </div>
            <h2 className="text-[clamp(1.8rem,3.5vw,2.8rem)] font-extrabold tracking-tight leading-[1.1] text-foreground">
              Institutional-grade capabilities
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon:<RiOrganizationChart />, title:"Multi-Tenant Organisation",     body:"Your own scoped environment: custom branding, domain, and organisation-level admin role." },
              { icon:<RiShieldCheckLine />,   title:"Institutional Audit Logs",      body:"Every action logged with timestamp and user ID for compliance and HR audits." },
              { icon:<RiBarChartBoxLine />,   title:"Institution-Wide Analytics",    body:"Total users, clusters, sessions, and enrolments — filterable by department or batch." },
              { icon:<RiGraduationCapLine />, title:"Mass Certificate Issuance",     body:"Thousands of branded certificates at once. Each with a unique verification URL." },
              { icon:<RiGroupLine />,         title:"Teacher Verification Workflow", body:"All faculty queue for admin approval before full access — control who teaches on your platform." },
              { icon:<RiSettings3Line />,     title:"Feature Flag Management",       body:"Enable or disable features per role or department. Gradual rollout control built in." },
              { icon:<RiFileTextLine />,      title:"GDPR & Data Export",            body:"Full JSON/CSV export, scheduled backups, and GDPR-compliant deletion. EU & UK compliant." },
              { icon:<RiGlobalLine />,        title:"Custom Branding",               body:"Replace Nexora with your logo, accent colour, sender email, and tagline platform-wide." },
              { icon:<RiSettings3Line />,     title:"Webhook & Integration Support", body:"Connect to SIS, LMS, or HR systems. Google Meet and Zoom integrations built-in." },
            ].map((f, i) => (
              <div key={f.title}
                className={cn(
                  "group rounded-2xl border border-border bg-card p-6",
                  "hover:border-teal-300/70 dark:hover:border-teal-700/60",
                  "hover:shadow-lg hover:shadow-teal-500/[0.06] dark:hover:shadow-teal-500/[0.08]",
                  "transition-all duration-300 hover:-translate-y-1.5",
                  r3.v ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                )}
                style={{ transitionDelay: r3.v ? `${i * 50}ms` : "0ms" }}>
                <div className="w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-950/50
                                border border-teal-200/60 dark:border-teal-800/50
                                flex items-center justify-center
                                text-teal-600 dark:text-teal-400 text-[18px] mb-4
                                group-hover:scale-110 transition-transform duration-300">
                  {f.icon}
                </div>
                <h3 className="text-[15.5px] font-bold text-foreground mb-2">{f.title}</h3>
                <p className="text-[13.5px] text-muted-foreground leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          DEPLOYMENT PHASES
      ══════════════════════════════════════════ */}
      <section className="py-24 lg:py-32 bg-muted/30 border-y border-border">
        <div ref={r4.ref}
          className={cn("max-w-6xl mx-auto px-6 sm:px-10 lg:px-16 transition-[opacity,transform] duration-700",
            r4.v ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
                            bg-teal-50 dark:bg-teal-950/40
                            border border-teal-200/60 dark:border-teal-800/60
                            text-teal-700 dark:text-teal-400
                            text-[11.5px] font-bold tracking-[.06em] uppercase mb-5">
              <RiSparklingFill className="animate-pulse" /> Deployment
            </div>
            <h2 className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-extrabold tracking-tight leading-[1.1] text-foreground mb-3">
              University deployment in three phases
            </h2>
            <p className="text-muted-foreground text-[15.5px] max-w-xl mx-auto">
              Works with — not against — your existing academic calendar.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {[["Phase 1","Institutional Setup","Our team configures your Organisation with logo, domain, branding, and admin accounts. SSO setup if required.","1–2 weeks"],
              ["Phase 2","Pilot Departments","2–3 pilot departments run their first sessions. Faculty create clusters, add students. Gather feedback.","2–4 weeks"],
              ["Phase 3","Institution-Wide Rollout","All departments onboarded. Bulk import students via CSV. Set feature flags per faculty.","Ongoing"],
            ].map(([phase, title, desc, timeline], i) => (
              <div key={phase}
                className={cn(
                  "rounded-3xl border border-border bg-card p-8 relative overflow-hidden",
                  "transition-[opacity,transform] duration-500",
                  r4.v ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                )}
                style={{ transitionDelay: r4.v ? `${i * 100}ms` : "0ms" }}>
                {i === 1 && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-600 to-teal-400" />
                )}
                <p className="text-[10.5px] font-black tracking-[.18em] uppercase text-teal-600 dark:text-teal-400 mb-3">{phase}</p>
                <h3 className="text-[18px] font-extrabold text-foreground mb-3 leading-snug">{title}</h3>
                <p className="text-[14px] text-muted-foreground leading-relaxed mb-5">{desc}</p>
                <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                  {timeline}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          TESTIMONIAL + CTA — dark cinematic
      ══════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-zinc-950 dark:bg-zinc-950">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,.025)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(20,184,166,.05),transparent)] pointer-events-none" />

        <div ref={r5.ref}
          className={cn("relative z-10 max-w-6xl mx-auto px-6 sm:px-10 lg:px-16 py-24 lg:py-32 grid lg:grid-cols-2 gap-16 transition-[opacity,transform] duration-700",
            r5.v ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10")}>

          <div>
            <div className="flex gap-1 mb-5">{[1,2,3,4,5].map(n => <span key={n} className="text-teal-400 text-lg">★</span>)}</div>
            <span className="block text-[72px] leading-none font-serif text-teal-500/20 mb-1 select-none">"</span>
            <p className="text-[clamp(1rem,1.8vw,1.25rem)] font-medium text-zinc-300 leading-[1.8] italic mb-8">
              We needed a platform individual lecturers would actually use — not another system IT
              forces on them. Nexora struck the right balance: institutional oversight from the top,
              genuine autonomy at the seminar level. Adoption was faster than any tool we've deployed
              in a decade.
            </p>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-teal-950 border border-teal-800/60
                              flex items-center justify-center text-[13px] font-extrabold text-teal-400">AK</div>
              <div>
                <p className="text-[14px] font-bold text-white">Prof. Arjun Krishnan</p>
                <p className="text-[12px] text-zinc-500">Director of Digital Learning · IIT Delhi</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center gap-5">
            <h2 className="text-[clamp(1.7rem,3vw,2.4rem)] font-extrabold leading-[1.1] tracking-tight text-white">
              Bring institutional rigour to every classroom.
            </h2>
            <p className="text-zinc-400 text-[15px]">Enterprise includes custom branding, SSO, audit logs, and a dedicated account manager.</p>
            <div className="flex flex-col gap-3 mt-2">
              <Link href="/contact"
                className="inline-flex items-center justify-between h-12 px-6 rounded-xl
                           bg-teal-600 hover:bg-teal-700 text-white font-bold text-[15px]
                           transition-all duration-200 hover:scale-[1.01] group">
                Request a demo <RiArrowRightLine className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/pricing"
                className="inline-flex items-center justify-between h-12 px-6 rounded-xl
                           border border-white/15 hover:border-teal-500/50
                           text-zinc-300 hover:text-teal-300 font-semibold text-[15px]
                           transition-all duration-200 group">
                View Enterprise plan <RiArrowRightLine className="text-zinc-600 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}