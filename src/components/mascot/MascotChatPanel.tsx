"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const ChatWidget = dynamic(() => import("@/components/chat/ChatWidget"), { ssr:false, loading:()=>null });
type ChatUser = { name:string; role:"STUDENT"|"TEACHER"|"ADMIN" };

export default function MascotChatPanel({ onClose }: { onClose:()=>void }) {
  const [user, setUser] = useState<ChatUser | null | undefined>(undefined);
  useEffect(() => { let live = true; fetch("/api/auth/me", { credentials:"include" }).then((r)=>r.ok?r.json():null).then((data)=>{ if (!live) return; const raw=data?.data?.userData??data?.data; setUser(raw?.name && raw?.role ? {name:raw.name,role:raw.role} : null); }).catch(()=>{if(live)setUser(null)}); return()=>{live=false}; }, []);
  if (user === undefined) return <div role="status" className="fixed right-6 bottom-6 z-50 rounded-xl border bg-background px-4 py-3 shadow-xl">Opening chat…</div>;
  return <ChatWidget embedded user={user} loginPath="/auth/signin" onClose={onClose} />;
}
