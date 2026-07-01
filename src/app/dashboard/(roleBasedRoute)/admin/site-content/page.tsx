import Link from "next/link";
import { RiArrowRightLine, RiLayoutLine } from "react-icons/ri";

import { SITE_CONTENT_CATALOG } from "@/content/site-content";

export default function SiteContentPage() {
  const groups = ["Global", "Homepage", "Authentication"] as const;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-teal-600 dark:text-teal-400">
          <RiLayoutLine /> Content studio
        </div>
        <h1 className="text-3xl font-black tracking-tight">Public site content</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Edit the navbar, every homepage section, footer, sign-in page, and sign-up page. Each area has its own editor.
        </p>
      </div>

      <div className="space-y-9">
        {groups.map((group) => (
          <section key={group}>
            <h2 className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">{group}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {SITE_CONTENT_CATALOG.filter((section) => section.group === group).map((section) => (
                <Link
                  key={section.key}
                  href={`/dashboard/admin/site-content/${section.key}`}
                  className="group rounded-2xl border border-border/70 bg-card/70 p-5 transition hover:-translate-y-0.5 hover:border-teal-500/30 hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-extrabold">{section.label}</h3>
                      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{section.description}</p>
                    </div>
                    <RiArrowRightLine className="mt-1 shrink-0 text-teal-500 transition group-hover:translate-x-1" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
