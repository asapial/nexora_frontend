"use client";

import { useEffect, useState } from "react";
import {
  RiBookOpenLine,
  RiMenuLine,
  RiGroupLine,
  RiCalendarLine,
  RiFileTextLine,
  RiGraduationCapLine,
  RiBarChartLine,
  RiQuestionLine,
  RiMailLine,
  RiShieldCheckLine,
  RiFileListLine,
  RiSparklingFill,
  RiArrowRightLine,
} from "react-icons/ri";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { ModeToggle } from "./themeToggleSwitch";

// ─── Types (unchanged from your original) ──────────────────
interface MenuItem {
  title: string;
  url: string;
  description?: string;
  icon?: React.ReactNode;
  items?: MenuItem[];
}

interface NavBarProps {
  className?: string;
  logo?: {
    url: string;
    src: string;
    alt: string;
    title: string;
    className?: string;
  };
  menu?: MenuItem[];
  auth?: {
    login: { title: string; url: string };
    signup: { title: string; url: string };
  };
}

// ─── Nexora NavBar ─────────────────────────────────────────
const NavBar = ({
  logo = {
    url: "/",
    src: "/logo/nexora.png",
    alt: "Nexora",
    title: "Nexora",
  },
  menu = [
    { title: "Home", url: "/" },
    {
      title: "Features",
      url: "#",
      items: [
        {
          title: "Clusters",
          description: "Create and manage learning groups with full member control",
          icon: <RiGroupLine className="size-5 shrink-0" />,
          url: "#clusters",
        },
        {
          title: "Sessions",
          description: "Schedule sessions and auto-generate tasks for every member",
          icon: <RiCalendarLine className="size-5 shrink-0" />,
          url: "#sessions",
        },
        {
          title: "Resources",
          description: "Upload, organize, and share papers, slides, and files",
          icon: <RiFileTextLine className="size-5 shrink-0" />,
          url: "#resources",
        },
        {
          title: "Courses",
          description: "Structured learning paths with certificates and payments",
          icon: <RiGraduationCapLine className="size-5 shrink-0" />,
          url: "#courses",
        },
        {
          title: "Analytics",
          description: "Track member progress, scores, and cluster health scores",
          icon: <RiBarChartLine className="size-5 shrink-0" />,
          url: "#analytics",
        },
      ],
    },
    {
      title: "Resources",
      url: "#",
      items: [
        {
          title: "Documentation",
          description: "Guides, API reference, and integration docs",
          icon: <RiBookOpenLine className="size-5 shrink-0" />,
          url: "#docs",
        },
        {
          title: "Help Center",
          description: "Answers to the most common questions",
          icon: <RiQuestionLine className="size-5 shrink-0" />,
          url: "#help",
        },
        {
          title: "Contact Us",
          description: "Reach our team — we respond within 24 hours",
          icon: <RiMailLine className="size-5 shrink-0" />,
          url: "#contact",
        },
        {
          title: "Terms of Service",
          description: "Our terms and conditions for using Nexora",
          icon: <RiFileListLine className="size-5 shrink-0" />,
          url: "#terms",
        },
        {
          title: "Privacy Policy",
          description: "How we collect, store, and protect your data",
          icon: <RiShieldCheckLine className="size-5 shrink-0" />,
          url: "#privacy",
        },
      ],
    },
    { title: "Pricing", url: "#pricing" },
    { title: "Blog", url: "#blog" },
  ],
  auth = {
    login: { title: "Log in", url: "/auth/login" },
    signup: { title: "Get Started", url: "/auth/register" },
  },
  className,
}: NavBarProps) => {
  const [scrolled, setScrolled] = useState(false);

  // Detect scroll to toggle glass intensity
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    // ── Fixed wrapper — outside document flow ──────────────
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? [
              // Scrolled — fully glass
              "bg-white/75 dark:bg-zinc-950/80",
              "backdrop-blur-xl",
              "border-b border-zinc-200/60 dark:border-zinc-800/60",
              "shadow-sm shadow-zinc-900/5 dark:shadow-zinc-900/30",
            ]
          : [
              // At top — near-transparent
              "bg-transparent",
              "backdrop-blur-sm",
              "border-b border-transparent",
            ],
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Desktop Nav ───────────────────────────────── */}
        <nav className="hidden items-center justify-between lg:flex h-16">

          {/* Left — Logo + Menu */}
          <div className="flex items-center gap-8">
            {/* Logo */}
            <a
              href={logo.url}
              className="flex items-center gap-2.5 group"
            >
              {/* <div className="relative flex items-center justify-center w-30 h-30">
                <img
                  src={logo.src}
                  className="w-full h-full object-contain "
                  alt={logo.alt}
                />
              </div> */}
              <span
                className={cn(
                  "text-[30px] font-bold tracking-tight transition-colors duration-200 ",
                  "text-teal-500 dark:text-teal-700",
                  "group-hover:text-teal-600 dark:group-hover:text-teal-400"
                )}
              >
                {logo.title}
              </span>
              {/* Version badge */}
              {/* <span className="hidden xl:inline-flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200/60 dark:border-teal-800/60">
                <RiSparklingFill className="text-[10px]" />
                v1.0
              </span> */}
            </a>

            {/* Navigation menu */}
            <NavigationMenu>
              <NavigationMenuList className="gap-0.5">
                {menu.map((item) => renderMenuItem(item))}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Right — Theme toggle + Auth */}
          <div className="flex items-center gap-2">
            <ModeToggle />
            <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-1" />
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 font-medium"
            >
              <a href={auth.login.url}>{auth.login.title}</a>
            </Button>
            <Button
              asChild
              size="sm"
              className={cn(
                "font-semibold gap-1.5 rounded-lg",
                "bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600",
                "text-white shadow-sm shadow-teal-600/20 dark:shadow-teal-500/20",
                "transition-all duration-200 hover:shadow-md hover:shadow-teal-600/25",
                "hover:scale-[1.02] active:scale-[0.98]"
              )}
            >
              <a href={auth.signup.url}>
                {auth.signup.title}
                <RiArrowRightLine className="text-sm" />
              </a>
            </Button>
          </div>
        </nav>

        {/* ── Mobile Nav ────────────────────────────────── */}
        <div className="flex lg:hidden items-center justify-between h-14">

          {/* Logo */}
          <a href={logo.url} className="flex items-center gap-2 group">
            <img
              src={logo.src}
              className="h-7 w-auto object-contain dark:invert"
              alt={logo.alt}
            />
            <span className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
              {logo.title}
            </span>
          </a>

          <div className="flex items-center gap-2">
            <ModeToggle />
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-lg border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm"
                >
                  <RiMenuLine className="size-4 text-zinc-700 dark:text-zinc-300" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>

              <SheetContent
                side="right"
                className="w-[300px] sm:w-[340px] overflow-y-auto border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl"
              >
                <SheetHeader className="pb-2">
                  <SheetTitle asChild>
                    <a href={logo.url} className="flex items-center gap-2">
                      <img
                        src={logo.src}
                        className="h-7 w-auto object-contain dark:invert"
                        alt={logo.alt}
                      />
                      <span className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                        {logo.title}
                      </span>
                    </a>
                  </SheetTitle>
                </SheetHeader>

                {/* Mobile sheet divider */}
                <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-4" />

                <div className="flex flex-col gap-6 px-1 pb-6">
                  <Accordion
                    type="single"
                    collapsible
                    className="flex w-full flex-col gap-1"
                  >
                    {menu.map((item) => renderMobileMenuItem(item))}
                  </Accordion>

                  {/* Mobile auth buttons */}
                  <div className="flex flex-col gap-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <Button
                      asChild
                      variant="outline"
                      className="w-full rounded-xl border-zinc-200 dark:border-zinc-700 font-medium"
                    >
                      <a href={auth.login.url}>{auth.login.title}</a>
                    </Button>
                    <Button
                      asChild
                      className="w-full rounded-xl bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white font-semibold gap-2"
                    >
                      <a href={auth.signup.url}>
                        {auth.signup.title}
                        <RiArrowRightLine className="text-sm" />
                      </a>
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

      </div>
    </div>
  );
};

// ── Desktop menu item renderer ─────────────────────────────
const renderMenuItem = (item: MenuItem) => {
  if (item.items) {
    return (
      <NavigationMenuItem key={item.title}>
        <NavigationMenuTrigger
          className={cn(
            "h-9 px-3 text-sm font-medium rounded-md",
            "text-zinc-600 dark:text-zinc-400",
            "bg-transparent hover:bg-zinc-100/70 dark:hover:bg-zinc-800/70",
            "hover:text-zinc-900 dark:hover:text-zinc-50",
            "data-[state=open]:bg-zinc-100/80 dark:data-[state=open]:bg-zinc-800/80",
            "data-[state=open]:text-zinc-900 dark:data-[state=open]:text-zinc-50",
            "transition-colors duration-150"
          )}
        >
          {item.title}
        </NavigationMenuTrigger>
        <NavigationMenuContent>
          {/* Dropdown glass panel */}
          <div
            className={cn(
              "p-2 rounded-xl",
              "bg-white/95 dark:bg-zinc-900/95",
              "backdrop-blur-xl",
              "border border-zinc-200/80 dark:border-zinc-800/80",
              "shadow-xl shadow-zinc-900/10 dark:shadow-zinc-900/40",
              "min-w-[320px]"
            )}
          >
            {item.items.map((subItem) => (
              <NavigationMenuLink asChild key={subItem.title}>
                <SubMenuLink item={subItem} />
              </NavigationMenuLink>
            ))}
          </div>
        </NavigationMenuContent>
      </NavigationMenuItem>
    );
  }

  return (
    <NavigationMenuItem key={item.title}>
      <NavigationMenuLink
        href={item.url}
        className={cn(
          "inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium",
          "text-zinc-600 dark:text-zinc-400",
          "hover:bg-zinc-100/70 dark:hover:bg-zinc-800/70",
          "hover:text-zinc-900 dark:hover:text-zinc-50",
          "transition-colors duration-150"
        )}
      >
        {item.title}
      </NavigationMenuLink>
    </NavigationMenuItem>
  );
};

// ── Mobile menu item renderer ──────────────────────────────
const renderMobileMenuItem = (item: MenuItem) => {
  if (item.items) {
    return (
      <AccordionItem
        key={item.title}
        value={item.title}
        className="border-b-0"
      >
        <AccordionTrigger
          className={cn(
            "py-2 px-2 rounded-lg text-sm font-semibold",
            "text-zinc-800 dark:text-zinc-200",
            "hover:bg-zinc-50 dark:hover:bg-zinc-900",
            "hover:no-underline",
            "transition-colors"
          )}
        >
          {item.title}
        </AccordionTrigger>
        <AccordionContent className="pt-1 pb-2">
          <div className="flex flex-col gap-0.5 pl-1">
            {item.items.map((subItem) => (
              <SubMenuLink key={subItem.title} item={subItem} mobile />
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    );
  }

  return (
    <a
      key={item.title}
      href={item.url}
      className={cn(
        "flex items-center h-9 px-2 rounded-lg",
        "text-sm font-semibold",
        "text-zinc-800 dark:text-zinc-200",
        "hover:bg-zinc-50 dark:hover:bg-zinc-900",
        "hover:text-teal-600 dark:hover:text-teal-400",
        "transition-colors"
      )}
    >
      {item.title}
    </a>
  );
};

// ── Sub-menu link (shared desktop + mobile) ────────────────
const SubMenuLink = ({
  item,
  mobile = false,
}: {
  item: MenuItem;
  mobile?: boolean;
}) => {
  return (
    <a
      href={item.url}
      className={cn(
        "flex flex-row items-start gap-3 rounded-lg p-2.5",
        "no-underline outline-none select-none",
        "transition-colors duration-150",
        "group",
        mobile
          ? "hover:bg-zinc-50 dark:hover:bg-zinc-900"
          : "hover:bg-zinc-50/80 dark:hover:bg-zinc-800/60"
      )}
    >
      {/* Icon container */}
      <div
        className={cn(
          "flex items-center justify-center rounded-md shrink-0",
          "w-9 h-9",
          "bg-zinc-100 dark:bg-zinc-800",
          "text-zinc-500 dark:text-zinc-400",
          "group-hover:bg-teal-50 dark:group-hover:bg-teal-950/60",
          "group-hover:text-teal-600 dark:group-hover:text-teal-400",
          "transition-colors duration-150"
        )}
      >
        {item.icon}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            "text-sm font-semibold leading-none mb-1",
            "text-zinc-800 dark:text-zinc-200",
            "group-hover:text-teal-700 dark:group-hover:text-teal-300",
            "transition-colors duration-150"
          )}
        >
          {item.title}
        </div>
        {item.description && (
          <p className="text-xs leading-snug text-zinc-500 dark:text-zinc-500 line-clamp-2">
            {item.description}
          </p>
        )}
      </div>
    </a>
  );
};

export { NavBar };