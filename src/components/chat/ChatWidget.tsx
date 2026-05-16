"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  RiSparklingFill, RiCloseLine, RiSendPlaneFill,
  RiDeleteBinLine, RiRobot2Line, RiUser3Line,
  RiLoginBoxLine, RiLockLine, RiMessage3Line,
  RiArrowDownSLine, RiArrowUpSLine, RiCpuLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import { useAuthChat, useGuestChat, ChatMessage } from "@/hooks/useChat";

type PanelState = "closed" | "minimized" | "open";

const QUICK_CHIPS: Record<string, string[]> = {
  STUDENT: ["My courses", "Pending tasks?", "Who is my teacher?", "Next session?"],
  TEACHER: ["List my clusters", "How many students?", "My resources", "Upcoming sessions"],
  ADMIN:   ["Total users", "Active courses", "How many teachers?", "Recent activity"],
  GUEST:   ["How do I register?", "How do I login?", "Try the demo", "Is Nexora free?", "What is a cluster?", "How to apply as teacher?"],
};

// ── Typing dots ───────────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="w-7 h-7 rounded-[10px] flex-shrink-0 flex items-center justify-center
                      bg-violet-100 dark:bg-violet-900/40 border border-violet-200/60 dark:border-violet-700/40
                      text-violet-600 dark:text-violet-400 text-xs">
        <RiRobot2Line />
      </div>
      <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-muted/60 border border-border/50 flex items-center gap-1.5">
        {[0, 1, 2].map(i => (
          <span key={i} className="w-[5px] h-[5px] rounded-full bg-violet-500 dark:bg-violet-400"
                style={{ animation: `ncBounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
        ))}
      </div>
    </div>
  );
}

// ── Inline markdown renderer ──────────────────────────────────────────────────
function renderInline(text: string, isUser = false): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)]+)\))/g;
  let last = 0; let match: RegExpExecArray | null; let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(<span key={key++}>{text.slice(last, match.index)}</span>);
    if (match[1].startsWith("**")) {
      parts.push(<strong key={key++} className="font-semibold">{match[2]}</strong>);
    } else {
      const href = match[4]; const label = match[3];
      parts.push(
        <a key={key++} href={href} target="_blank" rel="noopener noreferrer"
           onClick={e => e.stopPropagation()}
           className={cn("inline-flex items-center gap-1 px-2 py-[2px] rounded-full text-[11px] font-semibold no-underline transition-all hover:scale-[1.04]",
             isUser ? "bg-white/20 hover:bg-white/30 text-white border border-white/30"
                    : "bg-teal-50 dark:bg-teal-950/60 border border-teal-200/60 dark:border-teal-700/60 text-teal-700 dark:text-teal-300")}>
          {label}
          <svg className="w-2.5 h-2.5 opacity-70" fill="none" viewBox="0 0 10 10" stroke="currentColor" strokeWidth={2}>
            <path d="M2 8L8 2M8 2H4M8 2v4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </a>
      );
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(<span key={key++}>{text.slice(last)}</span>);
  return parts;
}

function renderLine(line: string, idx: number, isUser: boolean): React.ReactNode {
  if (line === "") return <div key={idx} className="h-1.5" />;
  const numbered = line.match(/^(\d+)\.\s+(.+)$/);
  if (numbered) return (
    <div key={idx} className="flex gap-2 items-start">
      <span className={cn("font-semibold flex-shrink-0 text-[11px] leading-[1.7]", isUser ? "opacity-70" : "text-teal-600 dark:text-teal-400")}>{numbered[1]}.</span>
      <span>{renderInline(numbered[2], isUser)}</span>
    </div>
  );
  const bullet = line.match(/^[-•]\s+(.+)$/);
  if (bullet) return (
    <div key={idx} className="flex gap-2 items-start">
      <span className={cn("flex-shrink-0 mt-[5px] w-[5px] h-[5px] rounded-full", isUser ? "bg-white/60" : "bg-teal-500 dark:bg-teal-400")} />
      <span>{renderInline(bullet[1], isUser)}</span>
    </div>
  );
  if (line.startsWith("## ") || line.startsWith("### ")) {
    const text = line.replace(/^#{2,3}\s+/, "");
    return <p key={idx} className={cn("font-bold text-[12px] mt-1", isUser ? "opacity-90" : "text-teal-700 dark:text-teal-400")}>{renderInline(text, isUser)}</p>;
  }
  if (line === "---") return <hr key={idx} className="border-current opacity-10 my-1" />;
  return <p key={idx}>{renderInline(line, isUser)}</p>;
}

// ── Message bubble ────────────────────────────────────────────────────────────
function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <div className={cn("flex items-end gap-2", isUser && "flex-row-reverse")}>
      <div className={cn("w-7 h-7 rounded-[10px] flex-shrink-0 flex items-center justify-center text-xs",
        isUser ? "bg-teal-100 dark:bg-teal-900/40 border border-teal-200/60 dark:border-teal-700/40 text-teal-600 dark:text-teal-400"
               : "bg-violet-100 dark:bg-violet-900/40 border border-violet-200/60 dark:border-violet-700/40 text-violet-600 dark:text-violet-400")}>
        {isUser ? <RiUser3Line /> : <RiRobot2Line />}
      </div>
      <div className={cn("max-w-[79%] px-3.5 py-2.5 text-[12.5px] leading-relaxed flex flex-col gap-[3px] shadow-sm",
        isUser ? "rounded-2xl rounded-br-sm bg-gradient-to-br from-teal-600 to-teal-500 text-white shadow-teal-500/20"
               : "rounded-2xl rounded-bl-sm bg-white dark:bg-muted/60 border border-border/60 text-foreground shadow-black/[0.04]")}>
        {msg.content.split("\n").map((line, i) => renderLine(line, i, isUser))}
        <p className={cn("text-[10px] mt-1 select-none opacity-50", isUser ? "text-right" : "")}>
          {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}

// ── Guest limit wall ──────────────────────────────────────────────────────────
function GuestLimitWall({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="mx-0.5 my-1 rounded-2xl border border-amber-200/50 dark:border-amber-800/40
                    bg-amber-50/60 dark:bg-amber-950/20 px-4 py-4 flex flex-col items-center gap-3 text-center">
      <div className="w-9 h-9 rounded-[10px] flex items-center justify-center
                      bg-amber-100/60 dark:bg-amber-950/50 border border-amber-200/50 dark:border-amber-800/40
                      text-amber-600 dark:text-amber-400">
        <RiLockLine className="text-base" />
      </div>
      <div>
        <p className="text-[13px] font-medium text-foreground mb-1">You've used your 3 free messages</p>
        <p className="text-[11.5px] text-muted-foreground leading-relaxed">Log in to unlock unlimited chat with your personal Nexora data.</p>
      </div>
      <button onClick={onLogin}
              className="inline-flex items-center gap-2 h-8 px-5 rounded-full bg-teal-600 hover:bg-teal-700 text-white text-[12px] font-medium transition-all hover:scale-[1.03]">
        <RiLoginBoxLine className="text-sm" /> Log in to continue
      </button>
    </div>
  );
}

// ── Shared panel header ───────────────────────────────────────────────────────
function PanelHeader({
  role, messageCount, onMinimize, onClose, onClear,
}: {
  role?: "STUDENT" | "TEACHER" | "ADMIN"; messageCount: number;
  onMinimize: () => void; onClose: () => void; onClear?: () => void;
}) {
  const roleColors: Record<string, string> = {
    ADMIN: "bg-violet-400/20 text-violet-100 border-violet-300/30",
    TEACHER: "bg-teal-400/20 text-teal-100 border-teal-300/30",
    STUDENT: "bg-sky-400/20 text-sky-100 border-sky-300/30",
  };
  return (
    <div className="bg-gradient-to-r from-violet-600 via-violet-500 to-teal-500
                    px-4 py-3 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-[12px] bg-white/15 backdrop-blur-sm border border-white/20
                        flex items-center justify-center">
          <RiSparklingFill className="text-white text-base animate-pulse" />
        </div>
        <div>
          <p className="text-white text-[13.5px] font-semibold leading-none mb-[3px]">Nexora AI</p>
          <div className="flex items-center gap-1.5">
            <span className="w-[5px] h-[5px] rounded-full bg-green-300 animate-pulse" />
            <span className="text-white/65 text-[10px] flex items-center gap-1">
              <RiCpuLine className="text-[9px]" /> RAG-powered · Online
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {role && (
          <span className={cn("text-[9.5px] font-bold tracking-widest uppercase px-2 py-[2px] rounded-md border", roleColors[role])}>
            {role.charAt(0) + role.slice(1).toLowerCase()}
          </span>
        )}
        {messageCount > 0 && onClear && (
          <button onClick={onClear} title="Clear chat"
                  className="w-7 h-7 rounded-lg flex items-center justify-center ml-1
                             text-white/50 hover:text-white hover:bg-white/10 transition-colors">
            <RiDeleteBinLine className="text-sm" />
          </button>
        )}
        <button onClick={onMinimize} title="Minimize"
                className="w-7 h-7 rounded-lg flex items-center justify-center
                           text-white/60 hover:text-white hover:bg-white/10 transition-colors">
          <RiArrowDownSLine className="text-base" />
        </button>
        <button onClick={onClose} title="Close"
                className="w-7 h-7 rounded-lg flex items-center justify-center
                           text-white/60 hover:text-white hover:bg-white/10 transition-colors">
          <RiCloseLine className="text-base" />
        </button>
      </div>
    </div>
  );
}

// ── Shared message area + input ───────────────────────────────────────────────
function MessageArea({
  messages, loading, error, children,
}: {
  messages: ChatMessage[]; loading: boolean; error: string | null; children?: React.ReactNode;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2.5 min-h-0
                    scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border/40">
      {children}
      {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
      {loading && <TypingIndicator />}
      {error && <p className="text-[11.5px] text-red-500 dark:text-red-400 text-center px-2">⚠ {error}</p>}
      <div ref={bottomRef} />
    </div>
  );
}

// ── Shared input bar ──────────────────────────────────────────────────────────
function InputBar({
  value, onChange, onSend, loading, disabled = false, footer,
}: {
  value: string; onChange: (v: string) => void; onSend: () => void;
  loading: boolean; disabled?: boolean; footer?: React.ReactNode;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 150); }, []);
  return (
    <div className="px-3 py-3 border-t border-border/60 bg-background/95 flex-shrink-0">
      <div className="flex items-center gap-2">
        <input ref={inputRef} type="text" value={value}
               onChange={e => onChange(e.target.value)}
               onKeyDown={e => e.key === "Enter" && !e.shiftKey && onSend()}
               placeholder="Ask anything…" disabled={loading || disabled}
               className={cn("flex-1 h-[38px] px-4 rounded-full text-[12.5px]",
                 "bg-muted/50 border border-border/60",
                 "focus:border-violet-400/50 focus:ring-[3px] focus:ring-violet-400/10 focus:outline-none",
                 "text-foreground placeholder:text-muted-foreground/50 transition-all",
                 "disabled:opacity-50 disabled:cursor-not-allowed")} />
        <button onClick={onSend} disabled={!value.trim() || loading || disabled}
                className="w-[38px] h-[38px] rounded-full flex items-center justify-center flex-shrink-0
                           bg-gradient-to-br from-violet-600 to-teal-500 text-white
                           transition-all hover:scale-105 active:scale-95
                           disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:scale-100
                           shadow-sm shadow-violet-500/30">
          <RiSendPlaneFill className="text-sm" />
        </button>
      </div>
      {footer}
      <p className="text-[10px] text-muted-foreground/35 text-center mt-2">
        Nexora AI · RAG-powered by your live data
      </p>
    </div>
  );
}

// ── Auth panel ────────────────────────────────────────────────────────────────
function AuthPanel({
  userName, role, onMinimize, onClose,
}: {
  userName: string; role: "STUDENT" | "TEACHER" | "ADMIN";
  onMinimize: () => void; onClose: () => void;
}) {
  const [input, setInput] = useState("");
  const { messages, loading, error, sendMessage, clearMessages } = useAuthChat();
  const chips = QUICK_CHIPS[role] || [];

  const handleSend = () => { if (!input.trim()) return; sendMessage(input); setInput(""); };

  return (
    <>
      <PanelHeader role={role} messageCount={messages.length}
                   onMinimize={onMinimize} onClose={onClose} onClear={clearMessages} />
      <MessageArea messages={messages} loading={loading} error={error}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center text-center gap-3 pt-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center
                            bg-gradient-to-br from-violet-100 to-teal-100
                            dark:from-violet-900/40 dark:to-teal-900/40
                            border border-violet-200/60 dark:border-violet-700/40 text-violet-600 dark:text-violet-400 text-xl">
              <RiMessage3Line />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-foreground mb-1">Hi {userName.split(" ")[0]} 👋</p>
              <p className="text-[12px] text-muted-foreground leading-relaxed">
                Ask me anything about your{" "}
                {role === "STUDENT" ? "courses, tasks & sessions"
                  : role === "TEACHER" ? "clusters, students, resources & courses"
                  : "platform stats & users"}.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 justify-center mt-1">
              {chips.map(chip => (
                <button key={chip} onClick={() => sendMessage(chip)}
                        className="px-3 py-[6px] rounded-full text-[11.5px] font-medium
                                   border border-border/60 bg-muted/40 text-muted-foreground
                                   hover:border-violet-300/80 dark:hover:border-violet-600/60
                                   hover:text-violet-600 dark:hover:text-violet-400
                                   hover:bg-violet-50/60 dark:hover:bg-violet-950/20 transition-all">
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}
      </MessageArea>
      <InputBar value={input} onChange={setInput} onSend={handleSend} loading={loading} />
    </>
  );
}

// ── Guest panel ───────────────────────────────────────────────────────────────
function GuestPanel({ onLogin, onMinimize, onClose }: { onLogin: () => void; onMinimize: () => void; onClose: () => void; }) {
  const [input, setInput] = useState("");
  const { messages, loading, error, sendMessage, limitReached, userMessageCount } = useGuestChat();
  const remaining = Math.max(0, 3 - userMessageCount);
  const handleSend = () => { if (!input.trim() || limitReached) return; sendMessage(input); setInput(""); };

  return (
    <>
      <PanelHeader messageCount={messages.length} onMinimize={onMinimize} onClose={onClose} />
      <MessageArea messages={messages} loading={loading} error={error}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center text-center gap-3 pt-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center
                            bg-gradient-to-br from-violet-100 to-teal-100
                            dark:from-violet-900/40 dark:to-teal-900/40
                            border border-violet-200/60 dark:border-violet-700/40 text-violet-600 dark:text-violet-400 text-xl">
              <RiMessage3Line />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-foreground mb-1">Hi there 👋</p>
              <p className="text-[12px] text-muted-foreground leading-relaxed">
                I'm Nexora AI. You have{" "}
                <span className="font-medium text-amber-500 dark:text-amber-400">{remaining} free message{remaining !== 1 ? "s" : ""}</span>.
                Log in for unlimited personalized help.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 justify-center mt-1">
              {QUICK_CHIPS.GUEST.map(chip => (
                <button key={chip} onClick={() => sendMessage(chip)} disabled={limitReached}
                        className="px-3 py-[6px] rounded-full text-[11.5px] font-medium
                                   border border-border/60 bg-muted/40 text-muted-foreground
                                   hover:border-violet-300/80 hover:text-violet-600
                                   hover:bg-violet-50/60 dark:hover:bg-violet-950/20 transition-all
                                   disabled:opacity-40 disabled:cursor-not-allowed">
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}
        {limitReached && <GuestLimitWall onLogin={onLogin} />}
      </MessageArea>
      {!limitReached ? (
        <InputBar value={input} onChange={setInput} onSend={handleSend} loading={loading}
                  footer={
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-[2px] rounded-full bg-border/40 overflow-hidden">
                        <div className="h-full rounded-full bg-amber-400 transition-all duration-500"
                             style={{ width: `${(userMessageCount / 3) * 100}%` }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground/50 tabular-nums flex-shrink-0">{userMessageCount}/3</span>
                    </div>
                  } />
      ) : (
        <div className="px-3 py-3 border-t border-border/60 bg-background/95 flex-shrink-0">
          <button onClick={onLogin}
                  className="w-full h-[38px] rounded-full flex items-center justify-center gap-2
                             bg-gradient-to-r from-violet-600 to-teal-500 text-white text-[13px] font-medium
                             transition-all hover:scale-[1.01] shadow-sm shadow-violet-500/30">
            <RiLoginBoxLine /> Log in for unlimited chat
          </button>
        </div>
      )}
    </>
  );
}

// ── Root widget ───────────────────────────────────────────────────────────────
interface ChatWidgetProps {
  user?: { name: string; role: "STUDENT" | "TEACHER" | "ADMIN" } | null;
  loginPath?: string;
}

export default function ChatWidget({ user, loginPath = "/auth/signin" }: ChatWidgetProps) {
  const [panelState, setPanelState] = useState<PanelState>("closed");
  const router = useRouter();
  const isLoggedIn = !!user;

  const open     = () => setPanelState("open");
  const minimize = () => setPanelState("minimized");
  const close    = () => setPanelState("closed");

  const handleLogin = () => { close(); router.push(loginPath); };

  return (
    <>
      <style>{`
        @keyframes ncBounce { 0%,60%,100%{transform:translateY(0);} 30%{transform:translateY(-4px);} }
        @keyframes ncSlideUp { from{opacity:0;transform:translateY(16px) scale(0.97);} to{opacity:1;transform:translateY(0) scale(1);} }
        @keyframes ncSlideRight { from{opacity:0;transform:translateX(20px) scale(0.96);} to{opacity:1;transform:translateX(0) scale(1);} }
        @keyframes ncGlow { 0%,100%{box-shadow:0 0 0 0 rgba(139,92,246,0.35);} 50%{box-shadow:0 0 0 8px rgba(139,92,246,0);} }
        .nc-panel { animation: ncSlideUp 0.25s cubic-bezier(0.22,1,0.36,1); }
        .nc-pill  { animation: ncSlideRight 0.2s cubic-bezier(0.22,1,0.36,1); }
        .nc-fab   { animation: ncGlow 3s ease-in-out infinite; }
      `}</style>

      {/* ── Floating button (closed state only) ── */}
      {panelState === "closed" && (
        <button onClick={open}
                className={cn(
                  "nc-fab fixed bottom-6 right-6 z-50 w-[54px] h-[54px] rounded-[18px]",
                  "bg-gradient-to-br from-violet-600 to-teal-500",
                  "text-white shadow-lg shadow-violet-600/30",
                  "flex items-center justify-center text-xl",
                  "transition-all duration-200 hover:scale-[1.06] active:scale-95"
                )}>
          <RiSparklingFill className="text-xl animate-pulse" />
          {!isLoggedIn && (
            <span className="absolute -top-1 -right-1 w-[18px] h-[18px] rounded-full
                             bg-amber-400 border-[2.5px] border-background
                             flex items-center justify-center text-[9px] font-bold text-amber-900">3</span>
          )}
        </button>
      )}

      {/* ── Minimized pill ── */}
      {panelState === "minimized" && (
        <div className="nc-pill fixed bottom-6 right-6 z-50 flex items-center gap-2.5
                        h-[50px] pl-3 pr-2 rounded-[16px]
                        bg-gradient-to-r from-violet-600 via-violet-500 to-teal-500
                        shadow-lg shadow-violet-600/30 cursor-pointer
                        hover:scale-[1.02] transition-all"
             onClick={open}>
          <div className="w-8 h-8 rounded-[10px] bg-white/20 flex items-center justify-center flex-shrink-0">
            <RiSparklingFill className="text-white text-sm animate-pulse" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-white text-[12.5px] font-semibold leading-none">Nexora AI</span>
            <span className="text-white/60 text-[10px]">Click to expand</span>
          </div>
          <button onClick={e => { e.stopPropagation(); close(); }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0
                             text-white/60 hover:text-white hover:bg-white/15 transition-colors ml-1">
            <RiCloseLine className="text-sm" />
          </button>
        </div>
      )}

      {/* ── Full panel ── */}
      {panelState === "open" && (
        <div className={cn(
          "nc-panel fixed bottom-6 right-6 z-50",
          "w-[370px] max-h-[590px] flex flex-col",
          "rounded-[20px] border border-border/50 bg-background",
          "shadow-2xl shadow-black/[0.18] dark:shadow-black/50 overflow-hidden"
        )}>
          {isLoggedIn
            ? <AuthPanel userName={user.name} role={user.role} onMinimize={minimize} onClose={close} />
            : <GuestPanel onLogin={handleLogin} onMinimize={minimize} onClose={close} />
          }
        </div>
      )}
    </>
  );
}