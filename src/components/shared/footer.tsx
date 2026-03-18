"use client";

import {
  RiTwitterXLine,
  RiGithubLine,
  RiLinkedinBoxLine,
  RiDiscordLine,
  RiMailLine,
  RiArrowRightUpLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────
export interface FooterLink {
  label: string;
  href: string;
  isExternal?: boolean;
  isNew?: boolean;
}

export interface FooterNavGroup {
  heading: string;
  links: FooterLink[];
}

export interface SocialLink {
  platform: "twitter" | "github" | "linkedin" | "discord" | "email" | "custom";
  href: string;
  label: string;
  /** Used only when platform = "custom" */
  customIcon?: React.ReactNode;
}

export interface FooterData {
  logo?: {
    /** Text shown beside the hex icon */
    name: string;
    /** Optional public image URL — if omitted the ⬡ hex is shown */
    src?: string;
  };
  tagline: string;
  contactEmail: string;
  copyrightText: string;
  navGroups: FooterNavGroup[];
  socialLinks: SocialLink[];
  legalLinks?: FooterLink[];
}

// ─── Social icon map ───────────────────────────────────────
function SocialIcon({ platform, customIcon }: Pick<SocialLink, "platform" | "customIcon">) {
  switch (platform) {
    case "twitter":  return <RiTwitterXLine  className="text-[15px]" />;
    case "github":   return <RiGithubLine    className="text-[15px]" />;
    case "linkedin": return <RiLinkedinBoxLine className="text-[15px]" />;
    case "discord":  return <RiDiscordLine   className="text-[15px]" />;
    case "email":    return <RiMailLine      className="text-[15px]" />;
    case "custom":   return <>{customIcon}</>;
    default:         return null;
  }
}

// ─── Default data ──────────────────────────────────────────
const DEFAULT_DATA: FooterData = {
  logo: { name: "Nexora" },
  tagline:
    "Where Knowledge Meets Mentorship. Built for researchers, teachers, and the curious.",
  contactEmail: "hello@nexora.com",
  copyrightText: `© ${new Date().getFullYear()} Nexora Technologies. All rights reserved.`,
  socialLinks: [
    { platform: "twitter",  href: "#", label: "Follow on X"        },
    { platform: "github",   href: "#", label: "GitHub"             },
    { platform: "linkedin", href: "#", label: "LinkedIn"           },
    { platform: "discord",  href: "#", label: "Join our Discord"   },
  ],
  navGroups: [
    {
      heading: "Platform",
      links: [
        { label: "Features",   href: "#features"   },
        { label: "Clusters",   href: "#clusters"   },
        { label: "Sessions",   href: "#sessions"   },
        { label: "Resources",  href: "#resources"  },
        { label: "Courses",    href: "#courses"    },
        { label: "Analytics",  href: "#analytics"  },
      ],
    },
    {
      heading: "Use Cases",
      links: [
        { label: "Research Labs",       href: "#" },
        { label: "Bootcamp Cohorts",    href: "#" },
        { label: "Corporate Training",  href: "#" },
        { label: "Tutoring Centres",    href: "#" },
        { label: "Universities",        href: "#" },
      ],
    },
    {
      heading: "Resources",
      links: [
        { label: "Documentation", href: "#docs",       isExternal: true },
        { label: "API Reference",  href: "#api",        isExternal: true },
        { label: "Changelog",      href: "#changelog"                   },
        { label: "Blog",           href: "#blog"                        },
        { label: "Status",         href: "#status",     isExternal: true },
      ],
    },
    {
      heading: "Company",
      links: [
        { label: "About",           href: "#about"   },
        { label: "Pricing",         href: "#pricing" },
        { label: "Contact",         href: "#contact" },
        { label: "Privacy Policy",  href: "#privacy" },
        { label: "Terms of Service",href: "#terms"   },
      ],
    },
  ],
  legalLinks: [
    { label: "Privacy",  href: "#privacy" },
    { label: "Terms",    href: "#terms"   },
    { label: "Cookies",  href: "#cookies" },
  ],
};

// ─── Section ───────────────────────────────────────────────
export default function FooterSection({ data = DEFAULT_DATA }: { data?: FooterData }) {
  return (
    <footer className="relative bg-zinc-950 text-zinc-400">

      {/* ── Teal accent rule at the very top ── */}
      <div className="h-px bg-gradient-to-r from-transparent via-teal-500/40 to-transparent" />

      {/* ── Subtle noise texture overlay ── */}
      <div className="absolute inset-0 opacity-[0.015] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJuIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjkiIG51bU9jdGF2ZXM9IjQiIHN0aXRjaFRpbGVzPSJzdGl0Y2giLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWx0ZXI9InVybCgjbikiLz48L3N2Zz4=')] pointer-events-none" />

      {/* ── Radial glow ── */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_30%_at_50%_0%,rgba(20,184,166,0.04),transparent)] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ══ Upper section ══════════════════════════════════ */}
        <div className="grid lg:grid-cols-[280px_1fr] gap-14 lg:gap-16 pt-16 pb-12 border-b border-white/[0.06]">

          {/* ── Brand column ── */}
          <div>
            {/* Logo */}
            <div className="flex items-center gap-2.5 mb-4">
              {data.logo?.src ? (
                <img
                  src={data.logo.src}
                  alt={data.logo.name}
                  className="h-8 w-auto object-contain invert"
                />
              ) : (
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-teal-500/12 border border-teal-500/25 text-teal-400 text-lg">
                  ⬡
                </div>
              )}
              <span className="text-[19px] font-extrabold tracking-tight text-white">
                {data.logo?.name ?? "Nexora"}
              </span>
            </div>

            {/* Tagline */}
            <p className="text-[13.5px] text-zinc-500 leading-relaxed mb-5 max-w-[220px]">
              {data.tagline}
            </p>

            {/* Contact email */}
            <div className="flex items-center gap-2 text-[13px] text-zinc-500 mb-5">
              <RiMailLine className="text-teal-500 text-sm flex-shrink-0" />
              <a
                href={`mailto:${data.contactEmail}`}
                className="hover:text-teal-400 transition-colors duration-150"
              >
                {data.contactEmail}
              </a>
            </div>

            {/* Social links */}
            <div className="flex flex-wrap gap-2">
              {data.socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  title={social.label}
                  target={social.href.startsWith("http") ? "_blank" : undefined}
                  rel={social.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center",
                    "border border-white/8 bg-white/[0.04]",
                    "text-zinc-500",
                    "hover:bg-teal-500/10 hover:border-teal-500/25 hover:text-teal-400",
                    "transition-all duration-200"
                  )}
                >
                  <SocialIcon
                    platform={social.platform}
                    customIcon={social.customIcon}
                  />
                </a>
              ))}
            </div>
          </div>

          {/* ── Nav groups ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {data.navGroups.map((group) => (
              <div key={group.heading}>
                <h4 className="text-[11px] font-extrabold tracking-[0.1em] uppercase text-white mb-4">
                  {group.heading}
                </h4>
                <ul className="flex flex-col gap-2.5">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        target={link.isExternal ? "_blank" : undefined}
                        rel={link.isExternal ? "noopener noreferrer" : undefined}
                        className="group inline-flex items-center gap-1 text-[13.5px] text-zinc-500 hover:text-teal-400 transition-colors duration-150"
                      >
                        {link.label}
                        {link.isExternal && (
                          <RiArrowRightUpLine className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                        {link.isNew && (
                          <span className="ml-1 px-1.5 py-0.5 rounded text-[8.5px] font-bold uppercase tracking-wider bg-teal-500/15 text-teal-400 border border-teal-500/20">
                            New
                          </span>
                        )}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* ══ Bottom bar ═════════════════════════════════════ */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-5">
          {/* Copyright */}
          <p className="text-[12.5px] text-zinc-600 order-2 sm:order-1">
            {data.copyrightText}
          </p>

          {/* Legal links */}
          {data.legalLinks && data.legalLinks.length > 0 && (
            <div className="flex items-center gap-5 order-1 sm:order-2">
              {data.legalLinks.map((link, i) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-[12.5px] text-zinc-600 hover:text-zinc-400 transition-colors duration-150"
                >
                  {link.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}