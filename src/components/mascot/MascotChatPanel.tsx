"use client";

import dynamic from "next/dynamic";
import { useOptionalSession } from "@/provider/session-provider";

const ChatWidget = dynamic(() => import("@/components/chat/ChatWidget"), { ssr:false, loading:()=>null });
type ChatUser = { name:string; role:"STUDENT"|"TEACHER"|"ADMIN" };

export default function MascotChatPanel({ onClose }: { onClose:()=>void }) {
  const session = useOptionalSession();
  const user: ChatUser | null = session?.user
    ? { name: session.user.name, role: session.user.role }
    : null;
  if (session?.loading) return <div role="status" className="fixed right-6 bottom-6 z-50 rounded-xl border bg-background px-4 py-3 shadow-xl">Opening chat…</div>;
  return <ChatWidget embedded user={user} loginPath="/auth/signin" onClose={onClose} />;
}
