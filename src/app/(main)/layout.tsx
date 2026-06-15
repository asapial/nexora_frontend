import type { FooterData } from "@/components/shared/footer";
import MainShell, { type NavbarContent } from "@/components/shared/MainShell";
import { getSiteContent } from "@/lib/site-content.server";

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
    </MainShell>
  );
}
