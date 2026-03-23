"use client";

import { useState, useRef, useEffect } from "react";
import {
  RiSparklingFill,
  RiMailLine,
  RiUserLine,
  RiChat3Line,
  RiArrowRightLine,
  RiCheckboxCircleLine,
  RiTimeLine,
  RiQuestionLine,
  RiShieldCheckLine,
  RiBuilding2Line,
} from "react-icons/ri";
import { cn } from "@/lib/utils";

const CHANNELS = [
  {
    icon: <RiChat3Line className="text-[20px]" />,
    title: "General Enquiry",
    value: "hello@nexora.com",
    desc: "Questions about Nexora, features, or anything else.",
    accent: "teal",
  },
  {
    icon: <RiShieldCheckLine className="text-[20px]" />,
    title: "Support",
    value: "support@nexora.com",
    desc: "Technical issues, account help, and bug reports.",
    accent: "violet",
  },
  {
    icon: <RiBuilding2Line className="text-[20px]" />,
    title: "Enterprise & Partnerships",
    value: "enterprise@nexora.com",
    desc: "Custom plans, universities, and integration partners.",
    accent: "amber",
  },
  {
    icon: <RiShieldCheckLine className="text-[20px]" />,
    title: "Privacy & Legal",
    value: "privacy@nexora.com",
    desc: "Data requests, GDPR enquiries, and legal matters.",
    accent: "sky",
  },
];

const ACCENT_STYLES: Record<string, { icon: string; bg: string; border: string }> = {
  teal:    { icon: "text-teal-600 dark:text-teal-400",     bg: "bg-teal-50 dark:bg-teal-950/50",    border: "border-teal-200/60 dark:border-teal-800/50" },
  violet:  { icon: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-950/50", border: "border-violet-200/60 dark:border-violet-800/50" },
  amber:   { icon: "text-amber-600 dark:text-amber-400",   bg: "bg-amber-50 dark:bg-amber-950/50",   border: "border-amber-200/60 dark:border-amber-800/50" },
  sky:     { icon: "text-sky-600 dark:text-sky-400",       bg: "bg-sky-50 dark:bg-sky-950/50",       border: "border-sky-200/60 dark:border-sky-800/50" },
};

const SUBJECTS = [
  "General question",
  "Technical support",
  "Feature request",
  "Enterprise / partnerships",
  "Billing & pricing",
  "Privacy & legal",
  "Other",
];

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function FormField({ label, id, children, error }: { label: string; id: string; children: React.ReactNode; error?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold text-zinc-700 dark:text-zinc-300">{label}</label>
      {children}
      {error && <p className="text-[12px] text-red-500 dark:text-red-400 font-medium">{error}</p>}
    </div>
  );
}

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const hero     = useReveal();
  const channels = useReveal();
  const formRef  = useReveal();

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(p => ({ ...p, [k]: e.target.value }));
    if (errors[k]) setErrors(p => ({ ...p, [k]: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim())   e.name    = "Name is required";
    if (!form.email.trim())  e.email   = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (!form.subject)       e.subject  = "Please select a subject";
    if (!form.message.trim()) e.message = "Message is required";
    else if (form.message.trim().length < 20) e.message = "Please write at least 20 characters";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1400)); // replace with your API call
    setLoading(false);
    setSent(true);
  };

  const inputCls = (field: string) => cn(
    "w-full h-11 px-4 rounded-xl text-sm font-medium",
    "bg-zinc-100 dark:bg-zinc-800/80 border",
    errors[field]
      ? "border-red-400 dark:border-red-500/70 focus:ring-red-400/20"
      : "border-zinc-200 dark:border-zinc-700/60 focus:border-teal-400 dark:focus:border-teal-500 focus:ring-teal-400/20",
    "text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 dark:placeholder:text-zinc-600",
    "focus:outline-none focus:ring-2 transition-all duration-150"
  );

  return (
    <main className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">

      {/* ── HERO ───────────────────────────────────────────── */}
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
            <RiSparklingFill className="animate-pulse" /> Contact
          </div>
          <h1 className="text-[clamp(2.2rem,5vw,3.6rem)] font-extrabold tracking-tight leading-[1.08] mb-5">
            We're here to help
          </h1>
          <p className="text-[clamp(1rem,1.8vw,1.15rem)] text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Send us a message or reach us directly. Our team responds within 24 hours on business days.
          </p>
        </div>
      </section>

      {/* ── CHANNELS ───────────────────────────────────────── */}
      <section className="pb-16 px-4 sm:px-6">
        <div
          ref={channels.ref}
          className={cn(
            "max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4",
            "transition-[opacity,transform] duration-700",
            channels.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          {CHANNELS.map((ch, i) => {
            const a = ACCENT_STYLES[ch.accent];
            return (
              <a
                key={ch.title}
                href={`mailto:${ch.value}`}
                className={cn(
                  "group flex flex-col gap-3 p-5 rounded-2xl border",
                  "bg-white dark:bg-zinc-900",
                  "border-zinc-200/80 dark:border-zinc-800/80",
                  "hover:border-teal-300/60 dark:hover:border-teal-700/60",
                  "hover:-translate-y-1 hover:shadow-lg",
                  "transition-all duration-250",
                  channels.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                )}
                style={{ transitionDelay: channels.visible ? `${i * 60}ms` : "0ms" }}
              >
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", a.bg, a.border, a.icon)}>
                  {ch.icon}
                </div>
                <div>
                  <p className="text-[14px] font-bold text-zinc-900 dark:text-zinc-50 mb-0.5">{ch.title}</p>
                  <p className="text-[12.5px] font-semibold text-teal-600 dark:text-teal-400 mb-1.5">{ch.value}</p>
                  <p className="text-[12px] text-zinc-500 dark:text-zinc-500 leading-relaxed">{ch.desc}</p>
                </div>
              </a>
            );
          })}
        </div>
      </section>

      {/* ── FORM + ASIDE ───────────────────────────────────── */}
      <section className="pb-28 px-4 sm:px-6 border-t border-zinc-100 dark:border-zinc-800/60">
        <div
          ref={formRef.ref}
          className={cn(
            "max-w-5xl mx-auto pt-16 grid lg:grid-cols-[1fr_340px] gap-12",
            "transition-[opacity,transform] duration-700",
            formRef.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >

          {/* ── Form ── */}
          <div>
            <h2 className="text-[1.7rem] font-extrabold tracking-tight mb-8">Send us a message</h2>

            {sent ? (
              <div className="flex flex-col items-center gap-4 py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200/60 dark:border-teal-800/60 flex items-center justify-center text-teal-600 dark:text-teal-400 text-3xl">
                  <RiCheckboxCircleLine />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Message received!</h3>
                <p className="text-zinc-500 dark:text-zinc-400 max-w-xs">
                  We'll get back to you at <span className="font-semibold text-zinc-700 dark:text-zinc-300">{form.email}</span> within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <FormField label="Your name" id="name" error={errors.name}>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 text-base pointer-events-none"><RiUserLine /></span>
                      <input id="name" type="text" placeholder="Dr. Jane Smith" value={form.name} onChange={set("name")} className={cn(inputCls("name"), "pl-10")} />
                    </div>
                  </FormField>
                  <FormField label="Email address" id="email" error={errors.email}>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 text-base pointer-events-none"><RiMailLine /></span>
                      <input id="email" type="email" placeholder="you@university.edu" value={form.email} onChange={set("email")} className={cn(inputCls("email"), "pl-10")} />
                    </div>
                  </FormField>
                </div>
                <FormField label="Subject" id="subject" error={errors.subject}>
                  <select id="subject" value={form.subject} onChange={set("subject")} className={cn(inputCls("subject"), "cursor-pointer")}>
                    <option value="">Select a subject…</option>
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </FormField>
                <FormField label="Message" id="message" error={errors.message}>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3.5 text-zinc-400 dark:text-zinc-500 text-base pointer-events-none"><RiChat3Line /></span>
                    <textarea
                      id="message"
                      rows={6}
                      placeholder="Tell us how we can help…"
                      value={form.message}
                      onChange={set("message")}
                      className={cn(
                        inputCls("message"),
                        "h-auto resize-none pl-10 pt-3 leading-relaxed"
                      )}
                    />
                  </div>
                </FormField>
                <button
                  type="submit"
                  disabled={loading}
                  className={cn(
                    "self-start inline-flex items-center gap-2 h-12 px-7 rounded-xl",
                    "bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600",
                    "text-white font-bold text-[15px] shadow-sm shadow-teal-600/20",
                    "transition-all duration-200 hover:scale-[1.02] active:scale-[0.99]",
                    "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                  )}
                >
                  {loading ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <><RiArrowRightLine /> Send message</>}
                </button>
              </form>
            )}
          </div>

          {/* ── Aside ── */}
          <div className="flex flex-col gap-5 lg:pt-14">
            <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/50 p-6">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200/60 dark:border-teal-800/60 flex items-center justify-center text-teal-600 dark:text-teal-400 text-base">
                  <RiTimeLine />
                </div>
                <p className="font-bold text-zinc-900 dark:text-zinc-50 text-[14.5px]">Response times</p>
              </div>
              <ul className="flex flex-col gap-2.5 text-[13px]">
                {[["General enquiry","1–2 business days"],["Support tickets","Within 24 hours"],["Enterprise","Same business day"]].map(([k,v]) => (
                  <li key={k} className="flex items-center justify-between gap-3">
                    <span className="text-zinc-500 dark:text-zinc-500">{k}</span>
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300 text-right">{v}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/50 p-6">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200/60 dark:border-teal-800/60 flex items-center justify-center text-teal-600 dark:text-teal-400 text-base">
                  <RiQuestionLine />
                </div>
                <p className="font-bold text-zinc-900 dark:text-zinc-50 text-[14.5px]">Before you write</p>
              </div>
              <p className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Check our{" "}
                <a href="/#faq" className="text-teal-600 dark:text-teal-400 font-semibold hover:underline">FAQ section</a>
                {" "}— most common questions are answered there instantly.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}