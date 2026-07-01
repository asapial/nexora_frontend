export type SiteContentValue =
  | string
  | number
  | boolean
  | null
  | SiteContentValue[]
  | { [key: string]: SiteContentValue };

export interface SiteContentSection {
  key: string;
  label: string;
  description: string;
  group: "Global" | "Homepage" | "Authentication";
  order: number;
  isVisible: boolean;
  content: Record<string, SiteContentValue>;
}

const features = [
  ["clusters", "Core", "Smart Clusters", "Create named groups, invite members by email, auto-generate one-time credentials, and track health scores - all from a single dashboard."],
  ["sessions", "Productivity", "Scheduled Sessions", "Plan sessions with agendas, auto-create tasks per member, track attendance, collect structured feedback, and link post-session recordings."],
  ["resources", "Knowledge", "Resource Library", "Upload papers, slides, and links. Gate downloads behind MCQ quizzes, allow threaded comments, pin top insights, and organize by category."],
  ["analytics", "Insights", "Live Analytics", "Monitor submission rates, attendance trends, cluster health scores, and member progress - with radar charts and weekly digest emails."],
  ["courses", "Learning", "Courses & Certificates", "Publish free or Stripe-paid courses with modular lessons. Auto-generate branded PDF certificates with public verification URLs on completion."],
  ["ai", "AI - New", "AI Study Companion", "RAG-powered chat over any uploaded resource. Get plain-language summaries, auto-generated practice questions, and smart grading suggestions."],
].map(([id, tagLabel, title, description]) => ({ id, tagLabel, title, description }));

const steps = [
  ["account", "01", "Step 01", "Create Your Account", "Sign up as a Teacher, join as a Student, or configure your platform as an Admin. Better Auth handles sessions, roles, and one-time credentials automatically - no manual setup needed."],
  ["cluster", "02", "Step 02", "Build Your Cluster", "Name your group, add a batch tag, and invite members by email. Nexora auto-generates one-time passwords and emails credentials - zero friction for students on day one."],
  ["session", "03", "Step 03", "Schedule a Session", "Set the date, location, online link, and deadline. Attach a task template and Nexora instantly creates one task per active member - with email and in-app notifications sent automatically."],
  ["submit", "04", "Step 04", "Members Submit & Engage", "Students submit tasks with text or file attachments, browse the resource library, mark session attendance, and leave structured feedback - all from their personal dashboard."],
  ["review", "05", "Step 05", "Review, Score & Grow", "Teachers rate submissions with rubric-based scoring, assign follow-up homework, and track radar-chart progress per member. Milestone badges auto-assign when criteria are met."],
  ["certify", "06", "Step 06 - Milestone", "Certify & Export", "Members complete courses and receive branded PDF certificates with unique verification URLs. Admins export full cluster performance reports as PDF or CSV for stakeholders."],
].map(([id, number, tag, title, description]) => ({ id, number, tag, title, description }));

const faqItems = [
  ["f1", "How do I create my first cluster?", "After signing up as a Teacher, click \"New Cluster\" from your dashboard. Give it a name, optional batch tag, and add member emails. Nexora auto-generates one-time credentials and emails them to every new member instantly.", "Getting Started"],
  ["f2", "Do students need to register before I add them?", "No. You just enter their emails. Nexora creates the account, generates a one-time password, and emails login credentials automatically. Students change their password on first login.", "Getting Started"],
  ["f3", "What happens when I create a session?", "A Task record is automatically created for every RUNNING member in the cluster. Email and in-app notifications are sent. Members can submit text or file attachments before the deadline you set.", "Features"],
  ["f4", "How does the cluster health score work?", "The health score (0-100) is auto-calculated from task submission rate, session attendance rate, and recent activity. Scores below 40 trigger an At Risk indicator.", "Features"],
  ["f5", "Can I give different access levels to co-teachers?", "Yes. When adding a co-teacher to a cluster, you choose full create/review access or observation-only access. You can change or revoke access at any time.", "Features"],
  ["f6", "Is Nexora free to use?", "Yes. The Free plan includes clusters, sessions, tasks, attendance, and resources with no time limit. Pro unlocks AI tools, advanced analytics, and higher storage limits.", "Pricing"],
  ["f7", "How are paid courses handled?", "Paid courses use Stripe Checkout. On successful payment the webhook activates enrollment automatically. Admins can also manually enroll users from the admin dashboard.", "Pricing"],
  ["f8", "What tech stack does Nexora run on?", "Next.js App Router and TypeScript frontend, Express, Prisma and PostgreSQL backend, Better Auth for sessions, Cloudinary for files, Stripe for payments, and AI-powered learning tools.", "Technical"],
  ["f9", "Does Nexora support webhooks?", "Yes. Admins can register outbound webhooks for platform events. Payloads are signed and delivery logs are available in the dashboard.", "Technical"],
].map(([id, question, answer, category]) => ({ id, question, answer, category }));

export const SITE_CONTENT_CATALOG: SiteContentSection[] = [
  {
    key: "navbar",
    label: "Navbar",
    description: "Brand, main navigation, dropdown sub-options, and auth buttons.",
    group: "Global",
    order: 0,
    isVisible: true,
    content: {
      logo: { url: "/", src: "/logo/nexora.png", alt: "Nexora", title: "Nexora" },
      menu: [
        { title: "Home", url: "/" },
        { title: "Courses", url: "/courses" },
        {
          title: "Dashboard",
          url: "/dashboard",
          items: [
            { title: "Student dashboard", url: "/dashboard/student", description: "Learning, tasks, courses, and progress." },
            { title: "Teacher dashboard", url: "/dashboard/teacher", description: "Clusters, sessions, resources, and analytics." },
          ],
        },
      ],
      auth: {
        login: { title: "Log in", url: "/auth/signin" },
        signup: { title: "Get Started", url: "/auth/signup" },
      },
    },
  },
  {
    key: "home-hero",
    label: "Homepage Hero",
    description: "Hero copy, buttons, trust items, floating labels, and stats.",
    group: "Homepage",
    order: 10,
    isVisible: true,
    content: {
      badge: "Introducing Nexora - Knowledge meets Mentorship",
      headlineStart: "The Platform Where",
      primaryWords: ["Researchers", "Teachers", "Mentors", "Educators"],
      joiner: "&",
      secondaryWords: ["Students", "Learners", "Scholars", "Members"],
      headlineEnd: "Grow Together",
      subtext: "Create clusters, schedule sessions, assign tasks, share resources, and track every member's progress - all in one beautifully unified workspace.",
      buttons: [
        { text: "Start for Free", link: "/auth/signup", variant: "primary" },
        { text: "Watch Demo", link: "/watch-demo", variant: "secondary" },
      ],
      trustItems: ["No credit card required", "Free forever plan", "GDPR compliant"],
      floatingCards: [
        { label: "Task Reviewed", value: "Excellent" },
        { label: "New Certificate", value: "ML Foundations" },
        { label: "Cluster Health", value: "94 - Healthy" },
      ],
      profileLabels: {
        neuralMatch: "Neural Match",
        researchGraph: "Research Graph",
        recentPublications: "Recent Pubs",
        publications: ["Quantum Computing", "Neural Research"],
        fallbackDesignation: "Impact Factor",
        fallbackName: "14.2",
        fallbackImage: "/images/senior_professor.png",
      },
      stats: [
        { label: "Active Clusters", value: "12,400+" },
        { label: "Resources Shared", value: "89,000+" },
        { label: "Sessions Held", value: "340,000+" },
        { label: "Certificates Issued", value: "28,000+" },
      ],
    },
  },
  {
    key: "home-courses",
    label: "Featured Courses",
    description: "Featured course section labels, links, and empty-state text.",
    group: "Homepage",
    order: 20,
    isVisible: true,
    content: {
      eyebrow: "Featured Courses",
      headline: "Learn from the",
      highlightedText: "best",
      subtext: "Hand-picked courses reviewed and approved by the Nexora team - built for depth, not breadth.",
      viewAllText: "View all",
      viewAllLink: "/courses",
      footerTitle: "More courses launching soon",
      footerText: "All courses are reviewed and approved by Nexora.",
      footerButtonText: "Browse all courses",
    },
  },
  {
    key: "home-features",
    label: "Features",
    description: "Features heading, cards, tags, descriptions, and bottom link.",
    group: "Homepage",
    order: 30,
    isVisible: true,
    content: {
      eyebrow: "Everything you need",
      headline: "One platform.",
      highlightedText: "Every tool.",
      subtext: "Nexora combines cluster management, session planning, resource sharing, analytics, and AI tools - so teachers and members can focus on what matters.",
      dragHint: "Drag cards to reorder your priorities",
      footerText: "All features available on the free plan.",
      footerMutedText: "Pro unlocks AI tools and advanced analytics.",
      footerLinkText: "See all plans",
      footerLink: "#pricing",
      cards: features,
    },
  },
  {
    key: "home-how-it-works",
    label: "How It Works",
    description: "Process heading, all six steps, and end marker.",
    group: "Homepage",
    order: 40,
    isVisible: true,
    content: {
      eyebrow: "How It Works",
      headline: "Up and running",
      highlightedText: "in minutes",
      subtext: "From signup to your first scored session - Nexora guides every step of the journey for teachers and members alike.",
      endText: "You're all set",
      steps,
    },
  },
  {
    key: "home-roles",
    label: "Roles",
    description: "Role section heading and teacher/student cards.",
    group: "Homepage",
    order: 50,
    isVisible: true,
    content: {
      eyebrow: "Choose your path",
      headline: "One platform,",
      highlightedText: "two powerful roles",
      subtext: "Whether you lead or learn, Nexora adapts fully to how you work.",
      roles: [
        {
          id: "teacher",
          badge: "Teacher",
          title: "Lead. Teach.\nInspire growth.",
          description: "Create clusters, schedule sessions, review submissions, track progress, and build a learning ecosystem your members will genuinely love.",
          features: ["Create & manage clusters with health scores", "Schedule sessions & auto-assign tasks", "Review, score & give rubric feedback", "Upload resources & run resource quizzes", "View member radar-chart progress"],
          glowColor: "rgba(13,148,136,0.45)",
          ctaText: "Start teaching",
          ctaLink: "/apply-as-teacher",
        },
        {
          id: "student",
          badge: "Student",
          title: "Learn. Submit.\nEarn your badge.",
          description: "Join clusters, submit tasks, browse resources, track your own progress, and build a verified certificate portfolio that speaks for itself.",
          features: ["Access cluster sessions & resources", "Submit tasks & track deadlines", "AI study companion on any resource", "Earn milestone badges automatically", "Download & share PDF certificates"],
          glowColor: "rgba(109,40,217,0.45)",
          ctaText: "Join as Student",
          ctaLink: "/auth/signin",
        },
      ],
    },
  },
  {
    key: "home-testimonials",
    label: "Testimonials",
    description: "Testimonials section labels and submission card copy.",
    group: "Homepage",
    order: 60,
    isVisible: true,
    content: {
      eyebrow: "Testimonials",
      headline: "Loved by researchers",
      highlightedText: "& learners worldwide",
      subtext: "Real stories from teachers and members who use Nexora every day.",
      addTitle: "Share your experience",
      addText: "It will be reviewed before publishing",
      submittedTitle: "Testimonial submitted",
      submittedText: "Pending admin review",
    },
  },
  {
    key: "home-faq",
    label: "FAQ",
    description: "FAQ introduction, categories, questions, answers, and contact link.",
    group: "Homepage",
    order: 70,
    isVisible: true,
    content: {
      eyebrow: "FAQ",
      headline: "Got questions?",
      subtext: "Everything you need to know about Nexora. Can't find the answer? Our team is ready to help.",
      contactText: "Ask our team",
      contactLink: "#contact",
      items: faqItems,
    },
  },
  {
    key: "home-cta",
    label: "Homepage Call To Action",
    description: "Final call-to-action copy, buttons, trust labels, and background.",
    group: "Homepage",
    order: 80,
    isVisible: true,
    content: {
      badge: "Start for free today",
      headline: "Your cluster is\nwaiting to be built",
      subtext: "Join thousands of teachers and researchers who use Nexora to manage groups, track progress, and grow knowledge together.",
      buttons: [
        { text: "Create free account", link: "/auth/signup", variant: "primary" },
        { text: "Watch a demo", link: "/watch-demo", variant: "ghost" },
      ],
      trustItems: [{ text: "No credit card" }, { text: "Free forever plan" }, { text: "GDPR compliant" }, { text: "Cancel anytime" }],
      backgroundColor: "",
      backgroundImageUrl: "",
      overlayOpacity: 0.65,
    },
  },
  {
    key: "footer",
    label: "Footer",
    description: "Footer brand, contact, social profiles, link groups, and legal links.",
    group: "Global",
    order: 90,
    isVisible: true,
    content: {
      logo: { name: "Nexora", src: "" },
      tagline: "Where Knowledge Meets Mentorship. Built for researchers, teachers, and the curious.",
      contactEmail: "hello@nexora.com",
      copyrightText: "Copyright {year} Nexora Technologies. All rights reserved.",
      socialLinks: [
        { platform: "twitter", href: "#", label: "Follow on X" },
        { platform: "github", href: "#", label: "GitHub" },
        { platform: "linkedin", href: "#", label: "LinkedIn" },
        { platform: "discord", href: "#", label: "Join our Discord" },
      ],
      navGroups: [
        { heading: "Platform", links: [{ label: "Features", href: "#features" }, { label: "Clusters", href: "#clusters" }, { label: "Sessions", href: "#sessions" }, { label: "Resources", href: "#resources" }, { label: "Courses", href: "#courses" }, { label: "Analytics", href: "#analytics" }] },
        { heading: "Use Cases", links: [{ label: "Research Labs", href: "/researchLab" }, { label: "Bootcamp Cohorts", href: "/Bootcampcohorts" }, { label: "Corporate Training", href: "/Corporatetraining" }, { label: "Tutoring Centres", href: "/Tutoringcentre" }, { label: "Universities", href: "/Universities" }] },
        { heading: "Resources", links: [{ label: "Documentation", href: "#docs", isExternal: true }, { label: "API Reference", href: "#api", isExternal: true }, { label: "Changelog", href: "#changelog" }, { label: "Blog", href: "#blog" }, { label: "Status", href: "#status", isExternal: true }] },
        { heading: "Company", links: [{ label: "About", href: "/about" }, { label: "Pricing", href: "/pricing" }, { label: "Contact", href: "/contact" }, { label: "Privacy Policy", href: "/privacyPolicy" }, { label: "Terms of Service", href: "/termsOfService" }] },
      ],
      legalLinks: [{ label: "Privacy", href: "#privacy" }, { label: "Terms", href: "#terms" }, { label: "Cookies", href: "#cookies" }],
    },
  },
  {
    key: "auth-signin",
    label: "Sign In Page",
    description: "Sign-in information panel, card labels, fields, links, and 2FA copy.",
    group: "Authentication",
    order: 100,
    isVisible: true,
    content: {
      brandName: "Nexora",
      heroTitle: "Welcome\nback.",
      heroText: "Sign in to manage your clusters, sessions, and members - all in one place.",
      floatingCards: [{ label: "Task Reviewed", value: "Excellent" }, { label: "Cluster Health", value: "94 - Healthy" }, { label: "New Resource", value: "Attention 2017" }],
      stats: [{ value: "12k+", label: "Clusters" }, { value: "340k+", label: "Sessions" }, { value: "28k+", label: "Certificates" }],
      cardTitle: "Sign in to your account",
      cardPrompt: "Don't have an account?",
      cardPromptLinkText: "Create one free",
      cardPromptLink: "/auth/signup",
      googleText: "Continue with Google",
      dividerText: "or",
      emailLabel: "Email address",
      emailPlaceholder: "you@university.edu",
      passwordLabel: "Password",
      passwordPlaceholder: "Enter your password",
      forgotPasswordText: "Forgot password?",
      forgotPasswordLink: "/auth/forgetPassword",
      submitText: "Sign in",
      legalText: "By signing in you agree to our Terms and Privacy Policy.",
      twoFactorTitle: "Two-Factor Authentication",
      twoFactorText: "Enter the 6-digit code from your authenticator app",
      twoFactorLabel: "Authenticator Code",
      twoFactorSubmitText: "Verify & Sign in",
      twoFactorBackText: "Back to sign in",
    },
  },
  {
    key: "auth-signup",
    label: "Sign Up Page",
    description: "Sign-up information panel, perks, form labels, and legal copy.",
    group: "Authentication",
    order: 110,
    isVisible: true,
    content: {
      brandName: "Nexora",
      badge: "Join as a Student",
      heroTitle: "Start your\nlearning journey.",
      heroText: "Create your free account and join thousands of learners already growing on Nexora.",
      perks: ["Auto-generated task deadlines", "Earn milestone badges automatically", "AI study companion on every resource", "PDF certificates with verification URL"],
      socialProofTitle: "8,000+ students",
      socialProofText: "already enrolled in clusters this month.",
      cardTitle: "Create your account",
      cardPrompt: "Already have an account?",
      cardPromptLinkText: "Sign in",
      cardPromptLink: "/auth/signin",
      googleText: "Continue with Google",
      dividerText: "or",
      photoLabel: "Profile photo",
      photoOptionalText: "(optional)",
      photoUploadText: "Click or drag to upload",
      photoHelpText: "JPG, PNG, WebP - Max 5 MB",
      nameLabel: "Full name",
      namePlaceholder: "Dr. Jane Smith",
      emailLabel: "Email address",
      emailPlaceholder: "you@university.edu",
      passwordLabel: "Password",
      passwordPlaceholder: "Create a strong password",
      confirmPasswordLabel: "Confirm password",
      confirmPasswordPlaceholder: "Re-enter your password",
      submitText: "Create account",
      legalText: "By creating an account you agree to our Terms and Privacy Policy.",
    },
  },
];

export const SITE_CONTENT_BY_KEY = Object.fromEntries(
  SITE_CONTENT_CATALOG.map((section) => [section.key, section]),
) as Record<string, SiteContentSection>;

export function cloneDefaultContent(key: string): Record<string, SiteContentValue> {
  return structuredClone(SITE_CONTENT_BY_KEY[key]?.content ?? {});
}
