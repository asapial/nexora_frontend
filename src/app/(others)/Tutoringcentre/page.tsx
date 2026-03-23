"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  RiBookOpenLine, RiArrowRightLine, RiCheckLine, RiSparklingFill,
  RiUserHeartLine, RiCalendarCheckLine, RiTimeLine, RiBarChartBoxLine,
  RiFileTextLine, RiGraduationCapLine, RiGroupLine, RiNotificationLine,
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

const FEATURES = [
  { icon: <RiUserHeartLine />,    title: "Individual Student Dashboards", body: "Scores, attendance, homework, badges — all in one sharable view. Parents can see it too." },
  { icon: <RiCalendarCheckLine />,title: "Homework Auto-Assignment",       body: "Create a session → homework tasks assigned to every student with a submission deadline." },
  { icon: <RiTimeLine />,         title: "Deadline Countdown Widget",      body: "Live countdown on every student dashboard. Push reminders 24h and 1h before." },
  { icon: <RiBarChartBoxLine />,  title: "Session Feedback & Ratings",     body: "Students rate sessions 1–5 and leave comments. Tutors see aggregated trends over time." },
  { icon: <RiFileTextLine />,     title: "Revision Resource Library",      body: "Past papers, notes, and video links organised by topic and session." },
  { icon: <RiGraduationCapLine />,title: "Term Completion Certificates",   body: "Branded certificates with unique verification URLs issued at end of each term." },
  { icon: <RiGroupLine />,        title: "Multi-Tutor Centres",            body: "Add co-tutors with edit or view-only access. Each tutor manages their own sessions." },
  { icon: <RiNotificationLine />, title: "Inactive Student Alerts",        body: "Auto-flag students with zero activity. Act before they fall too far behind." },
];

export default function TutoringCentresPage() {
  const r1 = useReveal(0.08); const r2 = useReveal(0.06);
  const r3 = useReveal(0.08); const r4 = useReveal(0.1);

  return (
    <main className="overflow-x-hidden bg-background text-foreground">

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section className="relative pt-28 pb-20 overflow-hidden bg-zinc-950 dark:bg-zinc-950">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,.03)_1px,transparent_1px)] bg-[size:52px_52px] pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-700 via-teal-500 to-teal-300" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_50%_30%,rgba(20,184,166,.06),transparent)] pointer-events-none" />
        <svg className="absolute top-0 right-0 opacity-[0.05] pointer-events-none" width="280" height="280" viewBox="0 0 280 280" fill="none">
          <circle cx="280" cy="0" r="200" stroke="#14b8a6" strokeWidth="1"/>
          <circle cx="280" cy="0" r="130" stroke="#14b8a6" strokeWidth="1"/>
          <circle cx="280" cy="0" r="70"  stroke="#14b8a6" strokeWidth="1"/>
        </svg>

        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
          <div className="grid lg:grid-cols-[1fr_400px] gap-14 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
                              bg-teal-500/10 border border-teal-500/25
                              text-teal-400 text-[11px] font-bold tracking-[.08em] uppercase mb-7">
                <RiSparklingFill className="animate-pulse" />
                Use case · Tutoring Centres
              </div>

              <h1 className="text-[clamp(2.8rem,6vw,5.2rem)] font-black leading-[.96]
                             tracking-[-0.035em] text-white mb-6">
                Give every student<br />
                the <TealText>attention</TealText><br />
                they deserve.
              </h1>

              <p className="text-[16px] text-zinc-300 leading-[1.75] max-w-[460px] mb-10">
                Nexora helps tutoring centres manage multiple student groups, track individual
                progress, share revision materials, and give parents verifiable evidence of
                their child's growth — from one simple dashboard.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link href="/register"
                  className="inline-flex items-center gap-2 h-12 px-7 rounded-xl
                             bg-teal-600 hover:bg-teal-700 text-white font-bold text-[15px]
                             shadow-lg shadow-teal-900/40
                             transition-all duration-200 hover:scale-[1.02]">
                  Start free <RiArrowRightLine />
                </Link>
                <Link href="/contact"
                  className="inline-flex items-center gap-2 h-12 px-7 rounded-xl
                             border border-white/15 hover:border-teal-500/50
                             text-zinc-300 hover:text-teal-300
                             font-semibold text-[15px] transition-all duration-200">
                  Book a demo
                </Link>
              </div>
            </div>

            {/* Student progress card visual */}
            <div className="hidden lg:flex flex-col gap-3">
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.05] backdrop-blur-sm p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-teal-500/20 border border-teal-500/30
                                  flex items-center justify-center text-[12px] font-extrabold text-teal-400">AK</div>
                  <div>
                    <p className="text-[14px] font-bold text-white">Aisha Khan</p>
                    <p className="text-[11.5px] text-zinc-500">GCSE Maths · Year 11</p>
                  </div>
                  <span className="ml-auto text-[10.5px] font-bold text-teal-400
                                   bg-teal-950/60 border border-teal-800/50 px-2 py-0.5 rounded-full">Healthy</span>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[["Tasks","8/10"],["Attend.","95%"],["Avg","82%"]].map(([k, val]) => (
                    <div key={k} className="bg-white/[0.05] rounded-xl p-2.5 text-center">
                      <p className="text-[17px] font-black text-white leading-none">{val}</p>
                      <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">{k}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-1.5 items-center">
                  {["🏅","⭐","📚"].map((b, i) => <span key={i} className="text-xl">{b}</span>)}
                  <span className="text-[11px] text-zinc-500 ml-1">3 badges earned</span>
                </div>
              </div>

              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4">
                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3">Recent homework</p>
                {[["Quadratic equations worksheet","Submitted","teal"],
                  ["Past paper Nov 2023 Q1–5","Graded 84%","teal"],
                  ["Revision notes — Chapter 6","Due Friday","zinc"],
                ].map(([name, status, col], i) => (
                  <div key={i} className="flex items-center gap-3 py-2.5 border-b border-white/[0.05] last:border-0">
                    <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0",
                      col === "teal" ? "bg-teal-500" : "bg-zinc-500")} />
                    <span className="flex-1 text-[13px] font-medium text-zinc-300 truncate">{name}</span>
                    <span className="text-[11px] text-zinc-500 font-semibold flex-shrink-0">{status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          STATS BAND
      ══════════════════════════════════════════ */}
      <div className="border-y border-border bg-muted/40">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 divide-x divide-border">
          {[["91%","Student satisfaction"],["3×","More visible progress"],["Zero","Admin hrs chasing hw"],["5 min","To set up a group"]].map(([v, l], i) => (
            <div key={i} className="flex flex-col items-center py-10 px-4 text-center">
              <p className="text-[2.2rem] font-black text-teal-600 dark:text-teal-400 tabular-nums leading-none mb-1.5">{v}</p>
              <p className="text-[11.5px] font-semibold text-muted-foreground">{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          NARRATIVE TIMELINE — the challenge
      ══════════════════════════════════════════ */}
      <section className="py-24 lg:py-32 bg-background">
        <div ref={r1.ref}
          className={cn("max-w-5xl mx-auto px-6 sm:px-10 lg:px-16 transition-[opacity,transform] duration-700",
            r1.v ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10")}>
          <div className="mb-14 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
                            bg-teal-50 dark:bg-teal-950/40
                            border border-teal-200/60 dark:border-teal-800/60
                            text-teal-700 dark:text-teal-400
                            text-[11.5px] font-bold tracking-[.06em] uppercase mb-5">
              <RiBookOpenLine /> The challenge
            </div>
            <h2 className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-extrabold tracking-tight leading-[1.1] text-foreground mb-3">
              Tutors are great teachers trapped in admin work
            </h2>
            <p className="text-muted-foreground text-[15.5px] max-w-xl mx-auto">A story we hear every week from tutoring centres of every size.</p>
          </div>

          <div className="relative border-l-2 border-teal-200 dark:border-teal-800/50 pl-10 flex flex-col gap-10">
            {[{ icon:"📱", h:"The notification jungle",     b:"Students submit homework over WhatsApp. Parents ask via email. Tutors track attendance in a notebook. Everything is scattered." },
              { icon:"📊", h:"The invisible report card",   b:"When parents ask 'How is my child doing?' the honest answer is 'I need to check my notes.' There's no single view of real progress." },
              { icon:"⏰", h:"The late intervention",       b:"A student misses two sessions. Then three. By the time the tutor notices, the student is weeks behind and starting to disengage." },
              { icon:"🏅", h:"The certificate crisis",      b:"At term end, the tutor designs a certificate in PowerPoint, fills it per student, and emails them one at a time. Hours gone." },
            ].map((item, i) => (
              <div key={i}
                className={cn("flex gap-5 relative transition-[opacity,transform] duration-500",
                  r1.v ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8")}
                style={{ transitionDelay: r1.v ? `${i * 80}ms` : "0ms" }}>
                <div className="absolute left-[-50px] w-10 h-10 rounded-full
                                bg-teal-50 dark:bg-teal-950/60
                                border-2 border-background
                                flex items-center justify-center text-lg flex-shrink-0">
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-foreground mb-2">{item.h}</h3>
                  <p className="text-[14px] text-muted-foreground leading-relaxed">{item.b}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          NEXORA'S ANSWERS — teal card grid
      ══════════════════════════════════════════ */}
      <section className="py-20 bg-teal-600 dark:bg-teal-700">
        <div className="max-w-5xl mx-auto px-6 sm:px-10 lg:px-16">
          <div className="text-center mb-10">
            <h2 className="text-[clamp(1.8rem,3.5vw,2.4rem)] font-extrabold leading-[1.1] text-white mb-3">
              Nexora fixes all four
            </h2>
            <p className="text-teal-100 text-[15.5px]">
              One platform that replaces the notebook, the spreadsheet, and the WhatsApp group.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[["One structured dashboard","Every student's scores, attendance, homework, and badges in a single view — sharable with parents in one click."],
              ["Homework auto-assigned","Create a session and homework tasks appear on every student's dashboard immediately. No individual messages."],
              ["At-risk alerts","Nexora flags any student with zero activity. You intervene while there's still time to turn it around."],
              ["Term certificates in seconds","Click 'Issue certificates'. Every student gets a branded PDF with a unique verification URL automatically."],
            ].map(([title, body], i) => (
              <div key={i} className="bg-white/15 dark:bg-white/10 backdrop-blur-sm
                                      border border-white/20 rounded-2xl p-6">
                <RiCheckLine className="text-teal-200 text-xl mb-3" />
                <h3 className="text-[16px] font-bold text-white mb-2">{title}</h3>
                <p className="text-[13.5px] text-teal-100 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════ */}
      <section className="py-24 lg:py-32 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
          <div ref={r2.ref}
            className={cn("mb-14 transition-[opacity,transform] duration-700",
              r2.v ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
                            bg-teal-50 dark:bg-teal-950/40
                            border border-teal-200/60 dark:border-teal-800/60
                            text-teal-700 dark:text-teal-400
                            text-[11.5px] font-bold tracking-[.06em] uppercase mb-5">
              <RiSparklingFill className="animate-pulse" /> Features
            </div>
            <h2 className="text-[clamp(1.8rem,3.5vw,2.8rem)] font-extrabold tracking-tight leading-[1.1] text-foreground">
              Everything tutors and students need
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((f, i) => (
              <div key={f.title}
                className={cn(
                  "group rounded-2xl border border-border bg-card p-6",
                  "hover:border-teal-300/70 dark:hover:border-teal-700/60",
                  "hover:shadow-lg hover:shadow-teal-500/[0.06] dark:hover:shadow-teal-500/[0.08]",
                  "transition-all duration-300 hover:-translate-y-1.5",
                  i === 0 && "lg:col-span-2",
                  r2.v ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                )}
                style={{ transitionDelay: r2.v ? `${i * 50}ms` : "0ms" }}>
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
          HOW IT WORKS
      ══════════════════════════════════════════ */}
      <section className="py-24 lg:py-32 bg-background border-t border-border">
        <div ref={r3.ref}
          className={cn("max-w-5xl mx-auto px-6 sm:px-10 lg:px-16 transition-[opacity,transform] duration-700",
            r3.v ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
          <div className="text-center mb-14">
            <h2 className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-extrabold tracking-tight leading-[1.1] text-foreground mb-3">
              Set up a new group in 5 minutes
            </h2>
            <p className="text-muted-foreground text-[15.5px] max-w-md mx-auto">If you can use email, you can use Nexora.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[["01","Create subject cluster","GCSE Maths — Year 11. Add students by email. Nexora handles onboarding."],
              ["02","Upload materials","Past papers, notes, video links. Organised by topic."],
              ["03","Schedule sessions","Homework auto-assigned with deadlines. Students see it immediately."],
              ["04","Track & celebrate","Review submissions, score with feedback, issue term certificates."],
            ].map(([num, title, desc], i) => (
              <div key={num}
                className={cn("transition-[opacity,transform] duration-500", r3.v ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10")}
                style={{ transitionDelay: r3.v ? `${i * 90}ms` : "0ms" }}>
                <div className="w-14 h-14 rounded-2xl bg-teal-600 dark:bg-teal-500
                                flex items-center justify-center text-white font-black text-[17px] mb-4
                                shadow-lg shadow-teal-600/25">
                  {num}
                </div>
                <h3 className="text-[16px] font-bold text-foreground mb-2">{title}</h3>
                <p className="text-[13.5px] text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          TESTIMONIAL + CTA
      ══════════════════════════════════════════ */}
      <section className="py-24 lg:py-28 bg-muted/30 border-t border-border">
        <div ref={r4.ref}
          className={cn("max-w-6xl mx-auto px-6 sm:px-10 lg:px-16 grid lg:grid-cols-2 gap-16 items-center transition-[opacity,transform] duration-700",
            r4.v ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10")}>

          <div>
            <span className="block text-[72px] leading-none font-serif text-teal-300/30 dark:text-teal-700/30 mb-2 select-none">"</span>
            <p className="text-[clamp(1rem,1.8vw,1.25rem)] font-medium text-foreground/80 leading-[1.8] italic mb-8">
              Parents used to ask me for progress updates and I'd scramble through my notes.
              Now I just pull up their child's Nexora dashboard and they see everything —
              scores, attendance, homework — in real time. It transformed parent relationships.
            </p>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-teal-100 dark:bg-teal-950/60
                              border border-teal-200/60 dark:border-teal-800/60
                              flex items-center justify-center text-[13px] font-extrabold
                              text-teal-700 dark:text-teal-400">PN</div>
              <div>
                <p className="text-[14px] font-bold text-foreground">Priya Nair</p>
                <p className="text-[12px] text-muted-foreground">Founder · BrightMinds Tutoring Centre</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="text-[clamp(1.7rem,2.8vw,2.2rem)] font-extrabold leading-[1.1] tracking-tight text-foreground">
              Give every student the visibility they deserve.
            </h2>
            <p className="text-muted-foreground text-[15px]">Free for up to 3 clusters · No credit card · Set up today.</p>
            <div className="flex flex-col gap-3 mt-2">
              <Link href="/register"
                className="inline-flex items-center justify-between h-12 px-6 rounded-xl
                           bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600
                           text-white font-bold text-[15px]
                           transition-all duration-200 hover:scale-[1.01] group">
                Start free <RiArrowRightLine className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/contact"
                className="inline-flex items-center justify-between h-12 px-6 rounded-xl
                           border border-border text-foreground
                           hover:border-teal-400 dark:hover:border-teal-600
                           hover:text-teal-700 dark:hover:text-teal-300
                           font-semibold text-[15px] transition-all duration-200 group">
                Book a demo call <RiArrowRightLine className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}