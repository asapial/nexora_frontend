"use client";

import * as React from "react";
import Link from "next/link";
import {
  // Shared / common
  RiDashboardLine,
  RiUserLine,
  RiSettings4Line,
  RiQuestionLine,
  RiNotificationLine,

  // Teacher
  RiFlaskLine,
  RiCalendarCheckLine,
  RiTaskLine,
  RiBookOpenLine,
  RiMegaphoneLine,
  RiUploadLine,
  RiCheckboxCircleLine,
  RiGroupLine,

  // Student
  RiGraduationCapLine,
  RiRoadMapLine,
  RiBook2Line,

  // Admin
  RiShieldCheckLine,
  RiMoneyDollarCircleLine,
  RiSparklingLine,
} from "react-icons/ri";

import { NavDocuments, type NavDocItem } from "@/components/nav-documents";
import { NavSecondary, type NavSecondaryItem } from "@/components/nav-secondary";
import { NavUser, type NavUserData } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

// ─── Role-based nav definitions ───────────────────────────────────────────────

const teacherNav: NavDocItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: <RiDashboardLine />,
  },
  {
    title: "Clusters",
    url: "/dashboard/teacher/cluster",
    icon: <RiFlaskLine />,
    items: [
      { title: "Create Cluster", url: "/dashboard/teacher/cluster/create" },
      { title: "Manage Cluster", url: "/dashboard/teacher/cluster/manageCluster" },
    ],
  },
  {
    title: "Sessions",
    url: "/dashboard/teacher/session",
    icon: <RiCalendarCheckLine />,
    items: [
      { title: "Create Session", url: "/dashboard/teacher/session/create" },
      { title: "Manage Session", url: "/dashboard/teacher/session/manageSession" },
    ],
  },
  {
    title: "Homework",
    url: "/dashboard/teacher/homeworkManagement",
    icon: <RiTaskLine />,
    items: [
      { title: "Homework Management", url: "/dashboard/teacher/homeworkManagement" },
      { title: "Attendance Tracking", url: "/dashboard/teacher/attendanceTracking" },
      { title: "Student Progress", url: "/dashboard/teacher/studentProgress" },
    ],
  },
  {
    title: "Courses",
    url: "/dashboard/teacher/courses",
    icon: <RiBookOpenLine />,
    items: [
      { title: "My Courses", url: "/dashboard/teacher/courses" },
      { title: "Create Course", url: "/dashboard/teacher/courses/create" },
      { title: "Earnings", url: "/dashboard/teacher/courses/earnings" },
      { title: "Price Requests", url: "/dashboard/teacher/courses/priceRequests" },
    ],
  },
  {
    title: "Resources",
    url: "/dashboard/teacher/resource",
    icon: <RiUploadLine />,
    items: [
      { title: "Upload Resource", url: "/dashboard/teacher/resource/upload" },
      { title: "My Resources", url: "/dashboard/teacher/resource/myResource" },
    ],
  },
  {
    title: "Announcements",
    url: "/dashboard/teacher/announcement",
    icon: <RiMegaphoneLine />,
    items: [
      { title: "Create Announcement", url: "/dashboard/teacher/announcement/create" },
    ],
  },
  {
    title: "Categories",
    url: "/dashboard/teacher/category",
    icon: <RiSparklingLine />,
    items: [
      { title: "Create Category", url: "/dashboard/teacher/category/create" },
    ],
  },
];

const studentNav: NavDocItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: <RiDashboardLine />,
  },
  {
    title: "My Clusters",
    url: "/dashboard/student/cluster",
    icon: <RiFlaskLine />,
    items: [
      { title: "My Clusters", url: "/dashboard/student/cluster" },
    ],
  },
  {
    title: "Courses",
    url: "/dashboard/student/courses",
    icon: <RiGraduationCapLine />,
    items: [
      { title: "Browse Courses", url: "/courses" },
      { title: "My Learning", url: "/dashboard/student/courses" },
    ],
  },
  {
    title: "Homework",
    url: "/dashboard/student/homework",
    icon: <RiTaskLine />,
    items: [
      { title: "My Homework", url: "/dashboard/student/homework" },
    ],
  },
  {
    title: "Sessions",
    url: "/dashboard/student/sessions",
    icon: <RiCalendarCheckLine />,
    items: [
      { title: "My Sessions", url: "/dashboard/student/sessions" },
    ],
  },
  {
    title: "Progress",
    url: "/dashboard/student/progress",
    icon: <RiRoadMapLine />,
    items: [
      { title: "My Progress", url: "/dashboard/student/progress" },
    ],
  },
  {
    title: "Resources",
    url: "/dashboard/student/resources",
    icon: <RiBook2Line />,
    items: [
      { title: "All Resources", url: "/dashboard/student/resources/all" },
    ],
  },
  {
    title: "Notices",
    url: "/dashboard/student/notice",
    icon: <RiNotificationLine />,
    items: [
      { title: "Notices", url: "/dashboard/student/notice" },
    ],
  },
];

const adminNav: NavDocItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: <RiDashboardLine />,
  },
  {
    title: "Courses",
    url: "/dashboard/admin/courses",
    icon: <RiBookOpenLine />,
    items: [
      { title: "All Courses", url: "/dashboard/admin/courses" },
    ],
  },
  {
    title: "Approvals",
    url: "/dashboard/admin/approvals",
    icon: <RiCheckboxCircleLine />,
    items: [
      { title: "Course Approvals", url: "/dashboard/admin/approvals/courses" },
      { title: "Mission Approvals", url: "/dashboard/admin/approvals/missions" },
      { title: "Price Requests", url: "/dashboard/admin/approvals/price-requests" },
    ],
  },
  {
    title: "Enrollments",
    url: "/dashboard/admin/enrollments",
    icon: <RiGroupLine />,
    items: [
      { title: "All Enrollments", url: "/dashboard/admin/enrollments" },
    ],
  },
  {
    title: "Revenue",
    url: "/dashboard/admin/revenue",
    icon: <RiMoneyDollarCircleLine />,
    items: [
      { title: "Revenue Overview", url: "/dashboard/admin/revenue" },
    ],
  },
  {
    title: "Teachers",
    url: "/dashboard/admin/teachers",
    icon: <RiShieldCheckLine />,
    items: [
      { title: "Create Teacher", url: "/dashboard/admin" },
    ],
  },
];

const commonNav: NavSecondaryItem[] = [
  { title: "Profile",   url: "/dashboard/profile",   icon: <RiUserLine /> },
  { title: "Settings",  url: "/dashboard/settings",  icon: <RiSettings4Line /> },
  { title: "Help",      url: "/help",                icon: <RiQuestionLine /> },
];

// ─── Role chip ────────────────────────────────────────────────────────────────
const ROLE_CHIP: Record<string, { label: string; cls: string }> = {
  TEACHER: { label: "Teacher",  cls: "text-teal-600 dark:text-teal-400 bg-teal-500/10 border-teal-500/25" },
  STUDENT: { label: "Student",  cls: "text-sky-600  dark:text-sky-400  bg-sky-500/10  border-sky-500/25"  },
  ADMIN:   { label: "Admin",    cls: "text-violet-600 dark:text-violet-400 bg-violet-500/10 border-violet-500/25" },
};

// ─── Sidebar ──────────────────────────────────────────────────────────────────
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [user, setUser] = React.useState<NavUserData>({ name: "", email: "", avatar: undefined, role: "" });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me", { method: "GET", credentials: "include" });
        const data = await res.json();
        if (data.success) {
          setUser({
            name:   data.data.userData.name,
            email:  data.data.userData.email,
            avatar: data.data.userData.image,
            role:   data.data.userData.role,
          });
        }
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    fetchUser();
  }, []);

  const role = user.role?.toUpperCase() as "TEACHER" | "STUDENT" | "ADMIN" | "";
  const navItems = role === "TEACHER" ? teacherNav : role === "STUDENT" ? studentNav : role === "ADMIN" ? adminNav : [];
  const chip = role ? ROLE_CHIP[role] : null;

  // Label shown above nav group
  const sectionLabel =
    role === "TEACHER" ? "Teacher Tools"  :
    role === "STUDENT" ? "My Learning"    :
    role === "ADMIN"   ? "Administration" : "Navigation";

  return (
    <Sidebar collapsible="offcanvas" {...props}>

      {/* ══ Brand ══════════════════════════════════════════════ */}
      <SidebarHeader className="border-b border-sidebar-border/60 pb-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" className="rounded-xl px-3 py-2.5 gap-3 h-auto hover:bg-sidebar-accent transition-colors duration-150">
              <Link href="/dashboard">
                {/* Hex icon */}
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[10px] text-[17px] bg-teal-500/12 dark:bg-teal-400/10 border border-teal-500/25 dark:border-teal-400/20 text-teal-600 dark:text-teal-400 select-none">
                  ⬡
                </div>
                <div className="flex flex-col justify-center min-w-0">
                  <span className="text-[15px] font-extrabold tracking-tight leading-none text-sidebar-foreground">Nexora</span>
                  <span className="text-[10px] font-medium tracking-[.07em] uppercase leading-none mt-0.5 text-sidebar-foreground/35">Dashboard</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Role chip */}
        {!loading && chip && (
          <div className="mt-2 px-3">
            <span className={`inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[10.5px] font-bold tracking-wide uppercase border ${chip.cls}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
              {chip.label}
            </span>
          </div>
        )}
        {loading && (
          <div className="mt-2 mx-3 h-6 w-20 rounded-full bg-sidebar-accent animate-pulse" />
        )}
      </SidebarHeader>

      {/* ══ Navigation ═════════════════════════════════════════ */}
      <SidebarContent className="gap-0 overflow-y-auto">

        {loading ? (
          /* skeleton while loading role */
          <div className="px-4 py-4 flex flex-col gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-9 rounded-lg bg-sidebar-accent animate-pulse" style={{ opacity: 1 - i * 0.12 }} />
            ))}
          </div>
        ) : navItems.length > 0 ? (
          <>
            {/* Section label */}
            <div className="px-5 pt-4 pb-1">
              <p className="text-[10px] font-bold tracking-[.12em] uppercase text-sidebar-foreground/30">{sectionLabel}</p>
            </div>
            <NavDocuments items={navItems} />
            <div className="mx-4 my-1 h-px bg-sidebar-border/40" />
          </>
        ) : (
          <div className="px-5 py-8 text-center">
            <p className="text-[12px] text-sidebar-foreground/40">Sign in to see your navigation</p>
          </div>
        )}

        {/* Common bottom links */}
        <NavSecondary items={commonNav} className="mt-auto" />
      </SidebarContent>

      {/* ══ User footer ════════════════════════════════════════ */}
      <SidebarFooter className="border-t border-sidebar-border/60 pt-2">
        <NavUser user={user} />
      </SidebarFooter>

    </Sidebar>
  );
}