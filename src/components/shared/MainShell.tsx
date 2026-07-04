"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import ChatWidget from "@/components/chat/ChatWidget";
import { NavBar, type MenuItem } from "@/components/shared/NavBar";
import FooterSection, { type FooterData } from "@/components/shared/footer";
import { ThemeProvider } from "@/provider/theme-provider";

type Role = "ADMIN" | "TEACHER" | "STUDENT";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: Role;
  emailVerified: boolean;
}

export interface NavbarContent {
  logo: { url: string; src: string; alt: string; title: string };
  menu: MenuItem[];
  auth: {
    login: { title: string; url: string };
    signup: { title: string; url: string };
  };
}

export default function MainShell({
  children,
  navbar,
  footer,
  showNavbar,
  showFooter,
}: {
  children: React.ReactNode;
  navbar: NavbarContent;
  footer: FooterData;
  showNavbar: boolean;
  showFooter: boolean;
}) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      const json = res.ok ? await res.json() : null;
      if (json?.success) {
        const raw = json.data.userData ?? json.data;
        setUser({
          id: raw.id,
          name: raw.name,
          email: raw.email,
          image: raw.image ?? null,
          role: raw.role,
          emailVerified: raw.emailVerified ?? false,
        });
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoadingUser(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {
      // Continue locally even when the request fails.
    }
    setUser(null);
    router.push("/");
    toast.success("Signed out successfully.");
  };

  const handleVerifyEmail = async () => {
    if (!user) return;
    const res = await fetch("/api/auth/resend-verification-email", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      const message = json?.message ?? "Verification email could not be sent. Please try again.";
      toast.error(message);
      throw new Error(message);
    }
    toast.success("Verification email sent! Check your inbox.");
    window.location.href = "/auth/verifyEmail";
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      {showNavbar && (
        <NavBar
          logo={navbar.logo}
          menu={navbar.menu}
          auth={navbar.auth}
          user={user}
          isLoadingUser={isLoadingUser}
          onSignOut={handleSignOut}
          onChangePassword={() => router.push("/auth/changePassword")}
          onVerifyEmail={handleVerifyEmail}
        />
      )}
      <ChatWidget
        user={user ? { name: user.name ?? "User", role: user.role } : null}
        loginPath="/auth/signin"
      />
      {children}
      {showFooter && <FooterSection data={footer} />}
    </ThemeProvider>
  );
}
