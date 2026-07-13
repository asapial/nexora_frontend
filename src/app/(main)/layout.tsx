import type { FooterData } from "@/components/shared/footer";
import MainShell, { type NavbarContent } from "@/components/shared/MainShell";
import { getSiteContent } from "@/lib/site-content.server";
import { MascotLoader } from "@/components/mascot";

// Next.js statically analyzes segment config exports — must be a literal.
// Keep in sync with SITE_CONTENT_REVALIDATE_SECONDS (600) in site-content.server.ts
export const revalidate = 600;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const sections = await getSiteContent();
  const navbarSection = sections.find((section) => section.key === "navbar")!;
  const footerSection = sections.find((section) => section.key === "footer")!;
  const footer = structuredClone(footerSection.content) as unknown as FooterData;
  footer.copyrightText = footer.copyrightText.replace("{year}", String(new Date().getFullYear()));

  return (
    <MainShell
      navbar={navbarSection.content as unknown as NavbarContent}
      footer={footer}
      showNavbar={navbarSection.isVisible}
      showFooter={footerSection.isVisible}
    >
      {children}
      <MascotLoader />
    </MainShell>
  );
}
