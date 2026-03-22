"use client";

import { useState, useEffect, useRef } from "react";
import { RiSparklingFill, RiShieldCheckLine, RiMailLine, RiArrowUpLine } from "react-icons/ri";
import { cn } from "@/lib/utils";

const LAST_UPDATED = "June 1, 2025";

const SECTIONS = [
  {
    id: "overview",
    title: "Overview",
    content: `Nexora Technologies ("Nexora", "we", "us", or "our") operates the Nexora platform accessible at nexora.com and via our mobile applications. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you use our services.

By using Nexora, you agree to the collection and use of information in accordance with this policy. If you do not agree with the terms of this policy, please do not access the platform.

We are committed to protecting your privacy and handling your data with transparency. We are fully compliant with the General Data Protection Regulation (GDPR), the California Consumer Privacy Act (CCPA), and other applicable data protection laws.`,
  },
  {
    id: "information-collected",
    title: "Information We Collect",
    content: `We collect several types of information for various purposes to provide and improve our service:

**Account Information:** When you create an account, we collect your name, email address, profile photo (if provided), and institutional affiliation. Passwords are hashed using industry-standard algorithms — we never store plaintext passwords.

**Usage Data:** We collect information about how you interact with the platform — pages visited, features used, session durations, and click patterns. This helps us improve the product experience.

**Content You Create:** Task submissions, resource uploads, comments, announcements, feedback, and all other content you create on the platform are stored and processed on our servers.

**Technical Data:** IP address, browser type and version, operating system, device identifiers, and cookies. This data is used for security, fraud prevention, and platform stability.

**Payment Information:** If you enrol in a paid course or subscribe to a Pro plan, payment is processed by Stripe. We do not store your full card number — only a tokenised payment reference.

**Communications:** If you contact our support team, we retain records of that correspondence to maintain context for future interactions.`,
  },
  {
    id: "how-we-use",
    title: "How We Use Your Information",
    content: `We use collected information for the following purposes:

**Service Delivery:** To create and manage your account, process enrolments, generate certificates, send notifications, and operate all platform features.

**Communication:** To send transactional emails (welcome, task notifications, session reminders, password resets) and, where you have consented, promotional updates about new features.

**Analytics & Improvement:** Aggregated, anonymised usage data helps us understand which features are valuable and where users encounter friction. We use this to prioritise product development.

**Security:** To detect and prevent fraud, abuse, and unauthorised access. We monitor for anomalous activity and may temporarily suspend accounts showing suspicious behaviour.

**Legal Compliance:** To comply with legal obligations, respond to lawful requests from authorities, enforce our Terms of Service, and protect the rights and safety of our users.

**AI Features:** If you use AI-powered features (AI Study Companion, AI-Assisted Grading), your content may be processed by our AI infrastructure. We do not use your content to train third-party AI models without explicit consent.`,
  },
  {
    id: "data-sharing",
    title: "Data Sharing & Third Parties",
    content: `We do not sell your personal data. We may share your information only in the following circumstances:

**Service Providers:** We work with trusted third-party vendors including Cloudinary (file storage), Stripe (payments), Resend (transactional email), and OpenAI (AI features). These vendors are contractually bound to handle your data only as instructed and in accordance with this policy.

**Organization Administrators:** If your account belongs to an institution or organization on Nexora's Enterprise plan, your organization's administrator may have access to your account data, usage information, and content as permitted under their agreement with Nexora.

**Legal Requirements:** We may disclose your information if required by law, court order, or governmental authority, or if we believe disclosure is necessary to protect our rights, prevent fraud, or ensure user safety.

**Business Transfers:** In the event of a merger, acquisition, or sale of company assets, your data may be transferred. We will notify you before your data becomes subject to a different privacy policy.

**Aggregate Data:** We may share anonymised, aggregated statistics (e.g., "users submit an average of 4.2 tasks per session") publicly or with partners. This data cannot be used to identify individuals.`,
  },
  {
    id: "data-retention",
    title: "Data Retention",
    content: `We retain your personal data for as long as your account is active or as needed to provide services. Specifically:

**Account Data:** Retained for the lifetime of your account and for 90 days after account deletion, after which it is permanently purged from our systems.

**Content & Submissions:** Task submissions, resources, and comments are retained while your account is active. Cluster data is retained for 12 months after a cluster is archived, then deleted unless an active membership links to it.

**Payment Records:** Transaction records are retained for 7 years to comply with financial regulations, even after account deletion.

**Logs & Analytics:** Server logs are retained for 30 days. Anonymised aggregated analytics data may be retained indefinitely.

**Legal Hold:** If your account is subject to an ongoing legal investigation or dispute, we may retain data beyond the standard periods described above.`,
  },
  {
    id: "your-rights",
    title: "Your Rights",
    content: `Depending on your jurisdiction, you have the following rights regarding your personal data:

**Right of Access:** You can request a copy of the personal data we hold about you.

**Right to Rectification:** You can correct inaccurate or incomplete personal data at any time through your profile settings or by contacting us.

**Right to Erasure ("Right to be Forgotten"):** You can request deletion of your personal data. Note that some data may be retained for legal compliance purposes as described in the Data Retention section.

**Right to Restriction:** You can ask us to restrict processing of your data in certain circumstances.

**Right to Data Portability:** You can request your data in a machine-readable format (JSON or CSV) for transfer to another service.

**Right to Object:** You can object to processing of your data for direct marketing purposes at any time.

**Right to Withdraw Consent:** Where processing is based on consent, you can withdraw consent at any time without affecting the lawfulness of prior processing.

To exercise any of these rights, email us at privacy@nexora.com. We will respond within 30 days. We may ask you to verify your identity before processing the request.`,
  },
  {
    id: "cookies",
    title: "Cookies & Tracking",
    content: `We use cookies and similar tracking technologies to enhance your experience on the platform.

**Essential Cookies:** Required for core functionality — session management, security tokens, and authentication. Cannot be disabled.

**Analytics Cookies:** Help us understand how users navigate the platform. We use anonymised analytics only. You can opt out through your browser settings or our cookie preference centre.

**Preference Cookies:** Remember your settings (theme, language, notification preferences) between sessions.

**No Third-Party Advertising:** We do not use advertising cookies or sell data to advertising networks. Nexora is an ad-free platform.

You can control cookie settings in your browser. Disabling essential cookies will affect platform functionality.`,
  },
  {
    id: "security",
    title: "Data Security",
    content: `We implement industry-standard technical and organisational measures to protect your data:

**Encryption:** All data is encrypted in transit using TLS 1.3. Sensitive data (passwords, tokens) is encrypted at rest using AES-256.

**Access Controls:** Employee access to production data is strictly need-to-know, logged, and reviewed quarterly. All access requires multi-factor authentication.

**Infrastructure:** We operate on cloud infrastructure with automated security patching, DDoS protection, and regular penetration testing.

**Incident Response:** We maintain an incident response plan. In the event of a data breach affecting your personal data, we will notify you and relevant authorities within 72 hours as required by GDPR.

Despite our best efforts, no system is completely immune to security risks. We encourage you to use a strong, unique password and enable two-factor authentication on your account.`,
  },
  {
    id: "children",
    title: "Children's Privacy",
    content: `Nexora is not directed at children under 16 years of age. We do not knowingly collect personal information from children under 16.

If you are a parent or guardian and believe your child has provided personal information to us, please contact us at privacy@nexora.com and we will promptly delete that information.

If you are under 16, please do not use the platform or provide any personal information to us.`,
  },
  {
    id: "changes",
    title: "Changes to This Policy",
    content: `We may update this Privacy Policy from time to time to reflect changes in our practices or applicable law. When we make material changes, we will:

1. Update the "Last Updated" date at the top of this page
2. Send an email notification to all registered users
3. Display a prominent banner on the platform for 30 days after the change

Your continued use of the platform after changes take effect constitutes acceptance of the updated policy. We encourage you to review this page periodically.`,
  },
  {
    id: "contact",
    title: "Contact Us",
    content: `If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:

**Email:** privacy@nexora.com
**Response time:** Within 30 days for data requests, within 5 business days for general enquiries.

**Data Controller:**
Nexora Technologies
[Registered Address]

If you are unsatisfied with our response, you have the right to lodge a complaint with your local data protection authority.`,
  },
];

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setV(true); }, { threshold: 0.05 });
    obs.observe(el); return () => obs.disconnect();
  }, []);
  return { ref, visible: v };
}

function renderContent(text: string) {
  return text.split("\n\n").map((para, i) => {
    if (para.startsWith("**") && para.includes(":**")) {
      const [bold, ...rest] = para.split(":** ");
      return (
        <p key={i} className="mb-4 last:mb-0">
          <span className="font-bold text-zinc-800 dark:text-zinc-200">{bold.replace(/\*\*/g, "")}:</span>
          {" "}{rest.join(": ")}
        </p>
      );
    }
    if (para.match(/^\d+\./)) {
      const items = para.split("\n");
      return (
        <ol key={i} className="list-decimal list-inside flex flex-col gap-1.5 mb-4">
          {items.map((it, j) => <li key={j} className="text-zinc-600 dark:text-zinc-400">{it.replace(/^\d+\.\s*/, "")}</li>)}
        </ol>
      );
    }
    return <p key={i} className="mb-4 last:mb-0 text-zinc-600 dark:text-zinc-400 leading-relaxed">{para}</p>;
  });
}

export default function PrivacyPolicyPage() {
  const [activeId, setActiveId] = useState("overview");
  const [showTop, setShowTop] = useState(false);
  const hero = useReveal();

  useEffect(() => {
    const onScroll = () => {
      setShowTop(window.scrollY > 400);
      const ids = SECTIONS.map(s => s.id);
      for (let i = ids.length - 1; i >= 0; i--) {
        const el = document.getElementById(ids[i]);
        if (el && el.getBoundingClientRect().top < 140) { setActiveId(ids[i]); break; }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <main className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">

      {/* ── HERO ── */}
      <section className="relative overflow-hidden pt-28 pb-14 lg:pt-36 lg:pb-20">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,0.03)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(20,184,166,0.06),transparent)] pointer-events-none" />
        <div
          ref={hero.ref}
          className={cn("relative z-10 max-w-3xl mx-auto px-4 text-center transition-[opacity,transform] duration-700", hero.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold border bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border-teal-200/60 dark:border-teal-800/60 mb-5">
            <RiShieldCheckLine /> Privacy Policy
          </div>
          <h1 className="text-[clamp(2rem,4.5vw,3.2rem)] font-extrabold tracking-tight leading-[1.1] mb-4">
            Your privacy matters to us
          </h1>
          <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4">
            We are committed to being transparent about how we collect, use, and protect your data.
          </p>
          <p className="text-[12.5px] text-zinc-400 dark:text-zinc-600">Last updated: {LAST_UPDATED}</p>
        </div>
      </section>

      {/* ── BODY ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-28 flex gap-10 lg:gap-16 items-start">

        {/* Sticky sidebar TOC */}
        <nav className="hidden lg:flex flex-col gap-1 sticky top-24 w-52 flex-shrink-0 pt-2">
          <p className="text-[10.5px] font-extrabold tracking-[.1em] uppercase text-zinc-400 dark:text-zinc-600 mb-2 px-2">Contents</p>
          {SECTIONS.map(s => (
            <a
              key={s.id}
              href={`#${s.id}`}
              onClick={() => setActiveId(s.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition-all duration-150",
                activeId === s.id
                  ? "bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400"
                  : "text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900"
              )}
            >
              {s.title}
            </a>
          ))}
        </nav>

        {/* Content */}
        <article className="flex-1 max-w-2xl pt-2">
          {SECTIONS.map(s => (
            <section key={s.id} id={s.id} className="mb-12 scroll-mt-28">
              <h2 className="text-[1.25rem] font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                {s.title}
              </h2>
              <div className="text-[14.5px] leading-[1.8]">{renderContent(s.content)}</div>
            </section>
          ))}

          {/* Contact box */}
          <div className="rounded-2xl border border-teal-200/60 dark:border-teal-800/50 bg-teal-50/50 dark:bg-teal-950/20 p-6 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950/60 flex items-center justify-center text-teal-600 dark:text-teal-400 text-base flex-shrink-0">
              <RiMailLine />
            </div>
            <div>
              <p className="font-bold text-zinc-900 dark:text-zinc-50 text-[14.5px] mb-1">Questions about your privacy?</p>
              <p className="text-[13.5px] text-zinc-500 dark:text-zinc-400">
                Email us at{" "}
                <a href="mailto:privacy@nexora.com" className="text-teal-600 dark:text-teal-400 font-semibold hover:underline">privacy@nexora.com</a>
                {" "}and we'll respond within 30 days.
              </p>
            </div>
          </div>
        </article>
      </div>

      {/* Scroll to top */}
      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 w-10 h-10 rounded-xl bg-teal-600 dark:bg-teal-500 text-white flex items-center justify-center shadow-lg hover:bg-teal-700 dark:hover:bg-teal-600 transition-all z-50"
          aria-label="Back to top"
        >
          <RiArrowUpLine className="text-base" />
        </button>
      )}
    </main>
  );
}