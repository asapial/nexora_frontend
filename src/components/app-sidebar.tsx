"use client";

import * as React from "react";
import Link from "next/link";
import {
  RiDashboardLine,
  RiFlaskLine,
  RiCalendarCheckLine,
  RiGroupLine,
  RiBarChartBoxLine,
  RiBook2Line,
  RiRobot2Line,
  RiAwardLine,
  RiFilePaperLine,
  RiShieldCheckLine,
  RiSettings3Line,
  RiNotificationLine,
  RiQuestionLine,
  RiSearchLine,
} from "react-icons/ri";

import { NavMain, type NavMainItem } from "@/components/nav-main";
import { NavDocuments, type NavDocItem } from "@/components/nav-documents";
import { NavSecondary, type NavSecondaryItem } from "@/components/nav-secondary";
import { NavUser, NavUserData, type NavUserData } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

// ─── Nav data ─────────────────────────────────────────────
// const navMain: NavDocItem[] = [
//   { title: "Dashboard", url: "/dashboard", icon: <RiDashboardLine /> ,isActive: false},
//   {
//     title: "Clusters", url: "/dashboard/clusters", icon: <RiFlaskLine />, isActive:false,
//     items: [
//       { title: "Create Cluster", url: "/dashboard/teacher/cluster/create" },
//       { title: "Manage Cluster", url: "/dashboard/teacher/cluster/manageCluster" }
//     ],
//   },
//   { title: "Sessions", url: "/dashboard/sessions", icon: <RiCalendarCheckLine /> },
//   { title: "Members", url: "/dashboard/members", icon: <RiGroupLine /> },
//   { title: "Analytics", url: "/dashboard/analytics", icon: <RiBarChartBoxLine /> },
// ];

const navMainTeacher: NavDocItem[] = [
  {
    title: "Cluster",
    url: "/dashboard/resources",
    icon: <RiBook2Line />,
    isActive: false,
    items: [
      { title: "Create Cluster", url: "/dashboard/teacher/cluster/create" },
      { title: "Manage Cluster", url: "/dashboard/teacher/cluster/manageCluster" }
    ],
  },
  {
    title: "Sessions",
    url: "/dashboard/ai",
    icon: <RiRobot2Line />,
    items: [
      { title: "Create Session", url: "/dashboard/teacher/session/create" },
      { title: "Manage Session", url: "/dashboard/teacher/session/manageSession" },
      { title: "Homework Management", url: "/dashboard/teacher/homeworkManagement" }
    ],
  },
  {
    title: "Categories",
    url: "/dashboard/certificates",
    icon: <RiAwardLine />,
    items: [
      { title: "Create Categories", url: "/dashboard/teacher/category/create" },
      // { title: "Verify a Code", url: "/dashboard/certificates/verify" },
    ],
  },
  {
    title: "Resources",
    url: "/dashboard/certificates",
    icon: <RiAwardLine />,
    items: [
      { title: "Upload Resources", url: "/dashboard/teacher/resource/upload" },
      { title: "My Resources", url: "/dashboard/teacher/resource/myResource" },
      // { title: "Verify a Code", url: "/dashboard/certificates/verify" },
    ],
  },
  {
    title: "Announcement",
    url: "/dashboard/certificates",
    icon: <RiAwardLine />,
    items: [
      { title: "Announcement", url: "/dashboard/teacher/announcement/create" },
    ],
  },
  {
    title: "Attendance Tracking",
    url: "/dashboard/certificates",
    icon: <RiAwardLine />,
    items: [
      { title: "Announcement", url: "/dashboard/teacher/attendanceTracking" },
    ],
  },
  {
    title: "Course",
    url: "/dashboard/certificates",
    icon: <RiAwardLine />,
    items: [
      { title: "My Course", url: "/dashboard/teacher/courses" },
      { title: "Create Course", url: "/dashboard/teacher/courses/create" },
      { title: "Earnings", url: "/dashboard/teacher/courses/earnings" },
    ],
  },
];

const navMainStudent: NavDocItem[] = [
  {
    title: "Cluster",
    url: "/dashboard/resources",
    icon: <RiBook2Line />,
    isActive: false,
    items: [
      { title: "Cluster", url: "/dashboard/student/cluster" },
      // { title: "Manage Cluster", url: "/dashboard/teacher/cluster/manageCluster" }
    ],
  },
  {
    title: "Homework",
    url: "/dashboard/ai",
    icon: <RiRobot2Line />,
    items: [
      { title: "Homework", url: "/dashboard/student/homework" },
      // { title: "Manage Session", url: "/dashboard/teacher/session/manageSession" },
      // { title: "Homework Management", url: "/dashboard/teacher/homeworkManagement" }
    ],
  },
  {
    title: "Categories",
    url: "/dashboard/certificates",
    icon: <RiAwardLine />,
    items: [
      { title: "Create Categories", url: "/dashboard/teacher/category/create" },
      // { title: "Verify a Code", url: "/dashboard/certificates/verify" },
    ],
  },
  {
    title: "Resources",
    url: "/dashboard/certificates",
    icon: <RiAwardLine />,
    items: [
      { title: "Upload Resources", url: "/dashboard/teacher/resource/upload" },
      { title: "My Resources", url: "/dashboard/teacher/resource/myResource" },
      // { title: "Verify a Code", url: "/dashboard/certificates/verify" },
    ],
  },
  {
    title: "Announcement",
    url: "/dashboard/certificates",
    icon: <RiAwardLine />,
    items: [
      { title: "Announcement", url: "/dashboard/teacher/announcement/create" },
    ],
  },
  {
    title: "Attendance Tracking",
    url: "/dashboard/certificates",
    icon: <RiAwardLine />,
    items: [
      { title: "Announcement", url: "/dashboard/teacher/attendanceTracking" },
    ],
  },
  {
    title: "Course",
    url: "/dashboard/certificates",
    icon: <RiAwardLine />,
    items: [
      { title: "My Course", url: "/dashboard/teacher/courses" },
      { title: "Create Course", url: "/dashboard/teacher/courses/create" },
      { title: "Earnings", url: "/dashboard/teacher/courses/earnings" },
    ],
  },
];

const navMainAdmin: NavDocItem[] = [
  {
    title: "Approvals",
    url: "/dashboard/resources",
    icon: <RiBook2Line />,
    isActive: false,
    items: [
      { title: "Courses", url: "/dashboard/admin/approvals/courses" },
      { title: "Missions", url: "/dashboard/admin/approvals/missions" },

    ]
  }

];

const navTools: NavDocItem[] = [
  {
    title: "Resources",
    url: "/dashboard/resources",
    icon: <RiBook2Line />,
    isActive: false,
    items: [
      { title: "All Resources", url: "/dashboard/resources" },
      { title: "Upload Paper", url: "/dashboard/resources/upload" },
      { title: "Quiz Library", url: "/dashboard/resources/quizzes" },
    ],
  },
  {
    title: "AI Companion",
    url: "/dashboard/ai",
    icon: <RiRobot2Line />,
    items: [
      { title: "Study Chat", url: "/dashboard/ai/chat" },
      { title: "Summarise PDF", url: "/dashboard/ai/summarise" },
    ],
  },
  {
    title: "Certificates",
    url: "/dashboard/certificates",
    icon: <RiAwardLine />,
    items: [
      { title: "Issue Certificates", url: "/dashboard/certificates/issue" },
      { title: "Verify a Code", url: "/dashboard/certificates/verify" },
    ],
  },
];

const navDocuments: NavDocItem[] = [
  { title: "Task Submissions", url: "/dashboard/tasks", icon: <RiFilePaperLine /> },
  { title: "Milestones", url: "/dashboard/milestones", icon: <RiAwardLine /> },
  { title: "Audit Log", url: "/dashboard/audit", icon: <RiShieldCheckLine /> },
];

const navSecondary: NavSecondaryItem[] = [
  { title: "Settings", url: "/dashboard/settings", icon: <RiSettings3Line /> },
  { title: "Notifications", url: "/dashboard/notifications", icon: <RiNotificationLine /> },
  { title: "Help", url: "/help", icon: <RiQuestionLine /> },
  { title: "Search", url: "/dashboard/search", icon: <RiSearchLine /> },
];




// ─── Sidebar ──────────────────────────────────────────────
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [user, setUser] = React.useState<NavUserData>({
    name: "",
    email: "",
    avatar: undefined,
    role: "",
  })

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/auth/me`, {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();
        console.log(data);

        if (data.success) {
          setUser({
            name: data.data.userData.name,
            email: data.data.userData.email,
            avatar: data.data.userData.image,
            role: data.data.userData.role,
          });
        }
      } catch (err) {
        console.error("Failed to fetch user:", err);
      }
    };
    fetchUser();
  }, []);

  return (
    <Sidebar collapsible="offcanvas" {...props}>

      {/* ══ Brand / Logo ═══════════════════════════════════ */}
      <SidebarHeader className="border-b border-sidebar-border/60 pb-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              className="
                rounded-xl px-3 py-2.5 gap-3 h-auto
                hover:bg-sidebar-accent
                transition-colors duration-150
              "
            >
              <Link href="/dashboard">
                {/* Hex icon */}
                <div className="
                  flex h-8 w-8 flex-shrink-0 items-center justify-center
                  rounded-[10px] text-[17px]
                  bg-teal-500/12 dark:bg-teal-400/10
                  border border-teal-500/25 dark:border-teal-400/20
                  text-teal-600 dark:text-teal-400
                ">
                  ⬡
                </div>

                <div className="flex flex-col justify-center min-w-0">
                  <span className="
                    text-[15px] font-extrabold tracking-tight leading-none
                    text-sidebar-foreground
                  ">
                    Nexora
                  </span>
                  <span className="
                    text-[10px] font-medium tracking-[.07em] uppercase leading-none mt-0.5
                    text-sidebar-foreground/35
                  ">
                    Dashboard
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* ══ Navigation sections ════════════════════════════ */}
      <SidebarContent className="gap-0">
        {/* Primary */}
        <NavDocuments items={navMainTeacher} />

        {/* Divider */}
        <div className="mx-4 my-1 h-px bg-sidebar-border/40" />

        {/* Tools — collapsible */}
        {/* <NavDocuments items={navTools} /> */}
        <p>Students</p>
        <NavDocuments items={navMainStudent} />

        {/* Divider */}
        <div className="mx-4 my-1 h-px bg-sidebar-border/40" />

                <p>Admin</p>
        <NavDocuments items={navMainAdmin} />

        {/* Quick documents */}
        <NavDocuments items={navDocuments} />

        {/* Secondary — pushes to bottom */}
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>

      {/* ══ User footer ════════════════════════════════════ */}
      <SidebarFooter className="border-t border-sidebar-border/60 pt-2">
        <NavUser user={user} />
      </SidebarFooter>

    </Sidebar>
  );
}