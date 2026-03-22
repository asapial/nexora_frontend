"use client";

import { useState, useEffect, useRef } from "react";
import { RiFileListLine, RiMailLine, RiArrowUpLine } from "react-icons/ri";
import { cn } from "@/lib/utils";

const LAST_UPDATED = "June 1, 2025";
const EFFECTIVE_DATE = "June 1, 2025";

const SECTIONS = [
  {
    id: "acceptance",
    title: "Acceptance of Terms",
    content: `By accessing or using the Nexora platform (the "Service") operated by Nexora Technologies ("Nexora", "we", "us", or "our"), you agree to be bound by these Terms of Service ("Terms").

If you are using the Service on behalf of an organisation, you represent that you have the authority to bind that organisation to these Terms, and references to "you" or "your" will refer to that organisation.

If you do not agree to these Terms, do not access or use the Service. We reserve the right to update these Terms at any time. Continued use of the Service after changes constitutes acceptance of the updated Terms.`,
  },
  {
    id: "eligibility",
    title: "Eligibility & Account Registration",
    content: `**Eligibility:** You must be at least 16 years of age to use Nexora. By creating an account, you confirm that you meet this requirement. If you are between 16 and 18, you must have consent from a parent or guardian.

**Account Accuracy:** You agree to provide accurate, current, and complete information during registration and to keep your account information updated.

**Account Security:** You are responsible for maintaining the confidentiality of your login credentials. You must notify us immediately at support@nexora.com if you suspect unauthorised access to your account.

**One Account Per Person:** You may not create multiple accounts for the same individual. Accounts are non-transferable.

**Teachers:** Teacher accounts require verification by a Nexora administrator before full platform access is granted. Submitting false information during verification is grounds for immediate account termination.`,
  },
  {
    id: "acceptable-use",
    title: "Acceptable Use",
    content: `You agree not to use the Service to:

**Prohibited Activities:**
- Upload, post, or transmit content that is illegal, defamatory, harassing, threatening, or discriminatory
- Violate any applicable local, national, or international law or regulation
- Infringe the intellectual property, privacy, or other rights of any third party
- Distribute spam, malware, phishing content, or other harmful materials
- Attempt to gain unauthorised access to any part of the Service or its infrastructure
- Use automated scripts, bots, or scrapers to access the Service without prior written permission
- Misrepresent your identity, qualifications, or institutional affiliation
- Use AI-assisted features to generate plagiarised or dishonest academic work
- Share one-time credentials or account access with third parties

**Enforcement:** Nexora reserves the right to suspend or terminate accounts that violate these terms without prior notice. We may preserve data for legal purposes even after account termination.`,
  },
  {
    id: "content",
    title: "User Content & Intellectual Property",
    content: `**Your Content:** You retain ownership of all content you create, upload, or submit on Nexora ("User Content"). By submitting User Content, you grant Nexora a non-exclusive, worldwide, royalty-free licence to host, store, process, and display your content solely for the purpose of operating and improving the Service.

**Responsibility:** You are solely responsible for the accuracy, legality, and appropriateness of your User Content. Nexora does not endorse any User Content.

**Platform IP:** All intellectual property in the Nexora platform — including software, design, logos, documentation, and APIs — belongs to Nexora Technologies. These Terms do not grant you any rights to use Nexora's intellectual property outside of using the Service.

**Feedback:** Any feedback, suggestions, or ideas you submit about the Service may be used by Nexora without compensation or attribution to you.

**DMCA / Takedowns:** If you believe content on Nexora infringes your copyright, contact us at legal@nexora.com with the information required by the DMCA. We will respond promptly to valid notices.`,
  },
  {
    id: "clusters-sessions",
    title: "Clusters, Sessions & Data",
    content: `**Teacher Responsibilities:** Teachers creating clusters are responsible for the accuracy of member data they enter, the appropriateness of tasks and resources they create, and the fair and lawful treatment of all cluster members.

**Member Data:** When a teacher adds a student to a cluster by email, the teacher confirms they have a legitimate educational basis for processing that student's data within the context of Nexora.

**Data Portability:** Cluster data, task submissions, and resources may be exported in CSV or PDF format by the cluster's owning teacher at any time.

**Cluster Deletion:** Soft-deleted clusters retain all data for 12 months before permanent deletion. Hard-deleted clusters are permanently purged within 30 days.

**AI Features:** Enabling AI features on a cluster means student submissions and resources within that cluster may be processed by our AI systems. The teacher enabling this feature is responsible for ensuring students are informed.`,
  },
  {
    id: "payments",
    title: "Payments, Subscriptions & Refunds",
    content: `**Free Plan:** The Free plan is provided at no cost and may be modified or discontinued with 30 days notice.

**Pro Subscriptions:** Pro subscriptions are billed monthly or annually. By subscribing, you authorise Nexora to charge the payment method on file at the applicable rate.

**Paid Courses:** Course purchases are non-refundable once you have accessed more than 20% of the course content. Within the first 14 days and below 20% completion, you may request a full refund.

**Free Trial:** Pro includes a 14-day free trial for new subscribers. If you do not cancel before the trial ends, you will be charged the applicable rate.

**Price Changes:** We will give 30 days notice before changing subscription prices. Continued use after the effective date constitutes acceptance of the new price.

**Failed Payments:** If a payment fails, we will retry for up to 7 days. After that, the subscription will downgrade to Free and data will be retained.

**Taxes:** Prices shown are exclusive of applicable taxes. You are responsible for all taxes associated with your use of the Service.`,
  },
  {
    id: "privacy",
    title: "Privacy",
    content: `Your use of the Service is also governed by our Privacy Policy, which is incorporated into these Terms by reference.

By using Nexora, you agree to the collection and use of information as described in our Privacy Policy available at nexora.com/privacy.

If you are a teacher adding students to a cluster, you acknowledge that you are a data controller for that student data, and Nexora acts as a data processor on your behalf. Our Data Processing Agreement (DPA) is available on request at privacy@nexora.com.`,
  },
  {
    id: "disclaimers",
    title: "Disclaimers & Limitation of Liability",
    content: `**"As-Is" Service:** The Service is provided "as is" and "as available" without warranties of any kind, express or implied. Nexora does not warrant that the Service will be error-free, uninterrupted, or meet your specific requirements.

**Limitation of Liability:** To the maximum extent permitted by law, Nexora shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service, including but not limited to loss of data, loss of revenue, or loss of opportunity.

**Maximum Liability:** Nexora's total liability to you for any claims under these Terms shall not exceed the greater of (a) the amount you paid to Nexora in the 12 months preceding the claim, or (b) £100.

**Indemnification:** You agree to indemnify and hold harmless Nexora, its officers, directors, employees, and agents from any claims, damages, or expenses (including legal fees) arising from your violation of these Terms or misuse of the Service.`,
  },
  {
    id: "termination",
    title: "Termination",
    content: `**By You:** You may delete your account at any time from your account settings. Account deletion is permanent after the 90-day grace period described in our Privacy Policy.

**By Nexora:** We reserve the right to suspend or terminate your account and access to the Service at any time, with or without cause, and with or without notice. Grounds for termination include but are not limited to: violation of these Terms, non-payment, or conduct that we determine to be harmful to other users or the platform.

**Effect of Termination:** Upon termination, your right to use the Service ceases immediately. Provisions of these Terms that by their nature should survive termination will do so, including intellectual property provisions, disclaimers, and limitation of liability.`,
  },
  {
    id: "governing-law",
    title: "Governing Law & Disputes",
    content: `**Governing Law:** These Terms shall be governed by and construed in accordance with the laws of England and Wales, without regard to its conflict of law provisions.

**Dispute Resolution:** Before initiating any formal legal proceeding, you agree to attempt to resolve any dispute informally by contacting us at legal@nexora.com. We will attempt in good faith to resolve disputes within 30 days.

**Jurisdiction:** If informal resolution fails, disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.

**Class Action Waiver:** To the extent permitted by law, you waive any right to participate in a class action lawsuit or class-wide arbitration against Nexora.`,
  },
  {
    id: "general",
    title: "General Provisions",
    content: `**Entire Agreement:** These Terms, together with our Privacy Policy and any additional terms applicable to specific features, constitute the entire agreement between you and Nexora regarding the Service.

**Severability:** If any provision of these Terms is found to be unenforceable, the remaining provisions will remain in full effect.

**No Waiver:** Nexora's failure to enforce any provision of these Terms shall not be deemed a waiver of that provision.

**Assignment:** Nexora may assign its rights and obligations under these Terms to a successor entity in the event of a merger, acquisition, or sale of substantially all assets.

**Force Majeure:** Nexora shall not be liable for any failure or delay in performance due to causes beyond our reasonable control, including natural disasters, government actions, or internet infrastructure failures.`,
  },
  {
    id: "contact-legal",
    title: "Contact",
    content: `For questions about these Terms of Service, please contact:

**Email:** legal@nexora.com
**Response time:** 5–10 business days

**Nexora Technologies**
[Registered Address]

For privacy-specific matters, contact privacy@nexora.com.
For support matters, contact support@nexora.com.`,
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
      const colonIdx = para.indexOf(":**");
      const boldPart = para.slice(2, colonIdx);
      const rest = para.slice(colonIdx + 3);
      return (
        <p key={i} className="mb-4 last:mb-0">
          <strong className="font-bold text-zinc-800 dark:text-zinc-200">{boldPart}:</strong>
          {rest}
        </p>
      );
    }
    if (para.startsWith("**Prohibited Activities:**")) {
      const lines = para.replace("**Prohibited Activities:**\n", "").split("\n").filter(Boolean);
      return (
        <div key={i} className="mb-4">
          <p className="font-bold text-zinc-800 dark:text-zinc-200 mb-2">Prohibited Activities:</p>
          <ul className="flex flex-col gap-1.5 pl-1">
            {lines.map((l, j) => (
              <li key={j} className="flex items-start gap-2 text-zinc-600 dark:text-zinc-400">
                <span className="text-teal-500 dark:text-teal-600 mt-1 flex-shrink-0">—</span>
                {l.replace(/^- /, "")}
              </li>
            ))}
          </ul>
        </div>
      );
    }
    return <p key={i} className="mb-4 last:mb-0 text-zinc-600 dark:text-zinc-400 leading-relaxed">{para}</p>;
  });
}

export default function TermsOfServicePage() {
  const [activeId, setActiveId] = useState("acceptance");
  const [showTop, setShowTop]   = useState(false);
  const hero = useReveal();

  useEffect(() => {
    const onScroll = () => {
      setShowTop(window.scrollY > 400);
      for (let i = SECTIONS.length - 1; i >= 0; i--) {
        const el = document.getElementById(SECTIONS[i].id);
        if (el && el.getBoundingClientRect().top < 140) { setActiveId(SECTIONS[i].id); break; }
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
            <RiFileListLine /> Terms of Service
          </div>
          <h1 className="text-[clamp(2rem,4.5vw,3.2rem)] font-extrabold tracking-tight leading-[1.1] mb-4">
            Terms of Service
          </h1>
          <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4">
            Please read these terms carefully before using Nexora. They govern your use of our platform and services.
          </p>
          <div className="flex items-center justify-center gap-4 text-[12.5px] text-zinc-400 dark:text-zinc-600">
            <span>Last updated: {LAST_UPDATED}</span>
            <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            <span>Effective: {EFFECTIVE_DATE}</span>
          </div>
        </div>
      </section>

      {/* ── BODY ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-28 flex gap-10 lg:gap-16 items-start">

        {/* Sticky TOC */}
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
              <p className="font-bold text-zinc-900 dark:text-zinc-50 text-[14.5px] mb-1">Questions about these terms?</p>
              <p className="text-[13.5px] text-zinc-500 dark:text-zinc-400">
                Email us at{" "}
                <a href="mailto:legal@nexora.com" className="text-teal-600 dark:text-teal-400 font-semibold hover:underline">legal@nexora.com</a>
                {" "}and we'll respond within 10 business days.
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