"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  RiSparklingFill, RiCloseLine, RiSendPlaneFill,
  RiDeleteBinLine, RiRobot2Line, RiUser3Line,
  RiLoginBoxLine, RiLockLine, RiMessage3Line,
  RiArrowDownSLine, RiArrowUpSLine, RiCpuLine,
  RiDraggable,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import { useAuthChat, useGuestChat, ChatMessage } from "@/hooks/useChat";

// ── Draggable hook ─────────────────────────────────────────────────────────────
function useDraggable(widgetW: number, widgetH: number) {
  // Default: bottom-right corner with 24px margin
  const getDefault = useCallback(() => {
    if (typeof window === "undefined") return { x: 24, y: 24 };
    return {
      x: window.innerWidth - widgetW - 24,
      y: window.innerHeight - widgetH - 24,
    };
  }, [widgetW, widgetH]);

  const [pos, setPos] = useState<{ x: number; y: number; } | null>(null);
  const dragging = useRef(false);
  const startMouse = useRef({ x: 0, y: 0 });
  const startPos = useRef({ x: 0, y: 0 });
  const hasDragged = useRef(false);

  // Initialise once on mount (client only)
  useEffect(() => { setPos(getDefault()); }, [getDefault]);

  // Clamp so widget stays fully within viewport
  const clamp = useCallback((x: number, y: number) => {
    const maxX = Math.max(0, window.innerWidth - widgetW);
    const maxY = Math.max(0, window.innerHeight - widgetH);
    return { x: Math.min(Math.max(0, x), maxX), y: Math.min(Math.max(0, y), maxY) };
  }, [widgetW, widgetH]);

  // Re-clamp on resize
  useEffect(() => {
    const onResize = () => setPos(p => p ? clamp(p.x, p.y) : getDefault());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [clamp, getDefault]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    // Only drag on left-button; ignore clicks on interactive children
    if (e.button !== 0) return;
    dragging.current = true;
    hasDragged.current = false;
    startMouse.current = { x: e.clientX, y: e.clientY };
    startPos.current = pos ?? getDefault();
    e.preventDefault();

    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      const dx = ev.clientX - startMouse.current.x;
      const dy = ev.clientY - startMouse.current.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasDragged.current = true;
      setPos(clamp(startPos.current.x + dx, startPos.current.y + dy));
    };
    const onUp = () => {
      dragging.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [pos, getDefault, clamp]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    dragging.current = true;
    hasDragged.current = false;
    const t = e.touches[0];
    startMouse.current = { x: t.clientX, y: t.clientY };
    startPos.current = pos ?? getDefault();

    const onMove = (ev: TouchEvent) => {
      if (!dragging.current) return;
      const tc = ev.touches[0];
      const dx = tc.clientX - startMouse.current.x;
      const dy = tc.clientY - startMouse.current.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasDragged.current = true;
      setPos(clamp(startPos.current.x + dx, startPos.current.y + dy));
      ev.preventDefault();
    };
    const onEnd = () => {
      dragging.current = false;
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
    };
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd);
  }, [pos, getDefault, clamp]);

  return { pos, onMouseDown, onTouchStart, wasDragged: () => hasDragged.current };
}

type PanelState = "closed" | "minimized" | "open";

const QUICK_CHIPS: Record<string, string[]> = {
  STUDENT: ["My courses", "Pending tasks?", "Who is my teacher?", "Next session?"],
  TEACHER: ["List my clusters", "How many students?", "My resources", "Upcoming sessions"],
  ADMIN: ["Total users", "Active courses", "How many teachers?", "Recent activity"],
  GUEST: ["How do I register?", "How do I login?", "Try the demo", "Is Nexora free?", "What is a cluster?", "How to apply as teacher?"],
};

// ── Typing dots ───────────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="w-7 h-7 rounded-[10px] flex-shrink-0 flex items-center justify-center
                      bg-teal-100 dark:bg-teal-900/40 border border-teal-200/60 dark:border-teal-700/40
                      text-teal-600 dark:text-teal-400 text-xs">
        <RiRobot2Line />
      </div>
      <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-muted/60 border border-border/50 flex items-center gap-1.5">
        {[0, 1, 2].map(i => (
          <span key={i} className="w-[5px] h-[5px] rounded-full bg-teal-500 dark:bg-teal-400"
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
            <path d="M2 8L8 2M8 2H4M8 2v4" strokeLinecap="round" strokeLinejoin="round" />
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
function MessageBubble({ msg }: { msg: ChatMessage; }) {
  const isUser = msg.role === "user";
  return (
    <div className={cn("flex items-end gap-2", isUser && "flex-row-reverse")}>
      <div className={cn("w-7 h-7 rounded-[10px] flex-shrink-0 flex items-center justify-center text-xs",
        isUser ? "bg-teal-100 dark:bg-teal-900/40 border border-teal-200/60 dark:border-teal-700/40 text-teal-600 dark:text-teal-400"
          : "bg-teal-100 dark:bg-teal-900/40 border border-teal-200/60 dark:border-teal-700/40 text-teal-600 dark:text-teal-400")}>
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
function GuestLimitWall({ onLogin }: { onLogin: () => void; }) {
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
  role, messageCount, onMinimize, onClose, onClear, onMouseDown, onTouchStart,
}: {
  role?: "STUDENT" | "TEACHER" | "ADMIN"; messageCount: number;
  onMinimize: () => void; onClose: () => void; onClear?: () => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  onTouchStart?: (e: React.TouchEvent) => void;
}) {
  const roleColors: Record<string, string> = {
    ADMIN: "bg-white/20 text-white border-white/30",
    TEACHER: "bg-white/20 text-white border-white/30",
    STUDENT: "bg-white/20 text-white border-white/30",
  };
  return (
    <div
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      style={{ cursor: onMouseDown ? "grab" : undefined }}
      className="bg-gradient-to-r from-teal-700 via-teal-600 to-teal-500
                  px-4 py-3 flex items-center justify-between flex-shrink-0 select-none"
    >
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
        {/* Drag hint icon */}
        {onMouseDown && (
          <RiDraggable className="text-white/30 text-base mr-0.5 pointer-events-none" />
        )}
        {role && (
          <span className={cn("text-[9.5px] font-bold tracking-widest uppercase px-2 py-[2px] rounded-md border", roleColors[role])}>
            {role.charAt(0) + role.slice(1).toLowerCase()}
          </span>
        )}
        {messageCount > 0 && onClear && (
          <button onClick={onClear} onMouseDown={e => e.stopPropagation()} title="Clear chat"
            className="w-7 h-7 rounded-lg flex items-center justify-center ml-1
                             text-white/50 hover:text-white hover:bg-white/10 transition-colors">
            <RiDeleteBinLine className="text-sm" />
          </button>
        )}
        <button onClick={onMinimize} onMouseDown={e => e.stopPropagation()} title="Minimize"
          className="w-7 h-7 rounded-lg flex items-center justify-center
                           text-white/60 hover:text-white hover:bg-white/10 transition-colors">
          <RiArrowDownSLine className="text-base" />
        </button>
        <button onClick={onClose} onMouseDown={e => e.stopPropagation()} title="Close"
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
            "focus:border-teal-400/50 focus:ring-[3px] focus:ring-teal-400/10 focus:outline-none",
            "text-foreground placeholder:text-muted-foreground/50 transition-all",
            "disabled:opacity-50 disabled:cursor-not-allowed")} />
        <button onClick={onSend} disabled={!value.trim() || loading || disabled}
          className="w-[38px] h-[38px] rounded-full flex items-center justify-center flex-shrink-0
                           bg-gradient-to-br from-teal-600 to-teal-500 text-white
                           transition-all hover:scale-105 active:scale-95
                           disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:scale-100
                           shadow-sm shadow-teal-500/30">
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




// ── Root widget ───────────────────────────────────────────────────────────────
interface ChatWidgetProps {
  user?: { name: string; role: "STUDENT" | "TEACHER" | "ADMIN"; } | null;
  loginPath?: string;
}

// Wrapper panels that forward drag props into PanelHeader
function AuthPanelDraggable({
  userName, role, onMinimize, onClose,
  onMouseDown, onTouchStart,
}: {
  userName: string; role: "STUDENT" | "TEACHER" | "ADMIN";
  onMinimize: () => void; onClose: () => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
}) {
  const [input, setInput] = useState("");
  const { messages, loading, error, sendMessage, clearMessages } = useAuthChat();
  const chips = QUICK_CHIPS[role] || [];
  const handleSend = () => { if (!input.trim()) return; sendMessage(input); setInput(""); };
  return (
    <>
      <PanelHeader role={role} messageCount={messages.length}
        onMinimize={onMinimize} onClose={onClose} onClear={clearMessages}
        onMouseDown={onMouseDown} onTouchStart={onTouchStart} />
      <MessageArea messages={messages} loading={loading} error={error}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center text-center gap-3 pt-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center
                            bg-gradient-to-br from-teal-100 to-teal-100
                            dark:from-teal-900/40 dark:to-teal-900/40
                            border border-teal-200/60 dark:border-teal-700/40 text-teal-600 dark:text-teal-400 text-xl">
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
                                   hover:border-teal-300/80 dark:hover:border-teal-600/60
                                   hover:text-teal-600 dark:hover:text-teal-400
                                   hover:bg-teal-50/60 dark:hover:bg-teal-950/20 transition-all">
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

function GuestPanelDraggable({
  onLogin, onMinimize, onClose,
  onMouseDown, onTouchStart,
}: {
  onLogin: () => void; onMinimize: () => void; onClose: () => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
}) {
  const [input, setInput] = useState("");
  const { messages, loading, error, sendMessage, limitReached, userMessageCount } = useGuestChat();
  const remaining = Math.max(0, 3 - userMessageCount);
  const handleSend = () => { if (!input.trim() || limitReached) return; sendMessage(input); setInput(""); };
  return (
    <>
      <PanelHeader messageCount={messages.length} onMinimize={onMinimize} onClose={onClose}
        onMouseDown={onMouseDown} onTouchStart={onTouchStart} />
      <MessageArea messages={messages} loading={loading} error={error}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center text-center gap-3 pt-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center
                            bg-gradient-to-br from-teal-100 to-teal-100
                            dark:from-teal-900/40 dark:to-teal-900/40
                            border border-teal-200/60 dark:border-teal-700/40 text-teal-600 dark:text-teal-400 text-xl">
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
                                   hover:border-teal-300/80 hover:text-teal-600
                                   hover:bg-teal-50/60 dark:hover:bg-teal-950/20 transition-all
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
                             bg-gradient-to-r from-teal-600 to-teal-500 text-white text-[13px] font-medium
                             transition-all hover:scale-[1.01] shadow-sm shadow-teal-500/30">
            <RiLoginBoxLine /> Log in for unlimited chat
          </button>
        </div>
      )}
    </>
  );
}

export default function ChatWidget({ user, loginPath = "/auth/signin" }: ChatWidgetProps) {
  const [panelState, setPanelState] = useState<PanelState>("closed");
  const router = useRouter();
  const isLoggedIn = !!user;

  const open = () => setPanelState("open");
  const minimize = () => setPanelState("minimized");
  const close = () => setPanelState("closed");
  const handleLogin = () => { close(); router.push(loginPath); };

  // Draggable – size depends on panel state
  const FAB_SIZE = 54;
  const PILL_W = 200; const PILL_H = 50;
  const PANEL_W = 370; const PANEL_H = 590;

  const fabDrag = useDraggable(FAB_SIZE, FAB_SIZE);
  const pillDrag = useDraggable(PILL_W, PILL_H);
  const panelDrag = useDraggable(PANEL_W, PANEL_H);

  return (
    <>
      <style>{`
        @keyframes ncBounce { 0%,60%,100%{transform:translateY(0);} 30%{transform:translateY(-4px);} }
        @keyframes ncSlideUp { from{opacity:0;transform:translateY(16px) scale(0.97);} to{opacity:1;transform:translateY(0) scale(1);} }
        @keyframes ncSlideRight { from{opacity:0;transform:translateX(20px) scale(0.96);} to{opacity:1;transform:translateX(0) scale(1);} }
        @keyframes ncGlow { 0%,100%{box-shadow:0 0 0 0 rgba(20,184,166,0.4);} 50%{box-shadow:0 0 0 10px rgba(20,184,166,0);} }
        .nc-panel { animation: ncSlideUp 0.25s cubic-bezier(0.22,1,0.36,1); }
        .nc-pill  { animation: ncSlideRight 0.2s cubic-bezier(0.22,1,0.36,1); }
        .nc-fab   { animation: ncGlow 3s ease-in-out infinite; }
        .nc-panel:active { cursor: default; }
      `}</style>

      {/* ── Floating button (closed) ── */}
      {panelState === "closed" && fabDrag.pos && (
        <button
          style={{ position: "fixed", left: fabDrag.pos.x, top: fabDrag.pos.y, zIndex: 50 }}
          onMouseDown={fabDrag.onMouseDown}
          onTouchStart={fabDrag.onTouchStart}
          onClick={() => { if (!fabDrag.wasDragged()) open(); }}
          className={cn(
            "nc-fab w-[54px] h-[54px] rounded-[18px]",
            "bg-gradient-to-br from-teal-600 to-teal-500",
            "text-white shadow-lg shadow-teal-600/30",
            "flex items-center justify-center text-xl",
            "transition-colors duration-200 hover:from-teal-500 hover:to-teal-400",
            "cursor-grab active:cursor-grabbing"
          )}
        >
          <RiSparklingFill className="text-xl animate-pulse pointer-events-none" />
          {!isLoggedIn && (
            <span className="absolute -top-1 -right-1 w-[18px] h-[18px] rounded-full
                             bg-amber-400 border-[2.5px] border-background
                             flex items-center justify-center text-[9px] font-bold text-amber-900">3</span>
          )}
        </button>
      )}

      {/* ── Minimized pill ── */}
      {panelState === "minimized" && pillDrag.pos && (
        <div
          style={{ position: "fixed", left: pillDrag.pos.x, top: pillDrag.pos.y, zIndex: 50 }}
          onMouseDown={pillDrag.onMouseDown}
          onTouchStart={pillDrag.onTouchStart}
          onClick={() => { if (!pillDrag.wasDragged()) open(); }}
          className="nc-pill flex items-center gap-2.5 h-[50px] pl-3 pr-2 rounded-[16px]
                      bg-gradient-to-r from-teal-700 via-teal-600 to-teal-500
                      shadow-lg shadow-teal-600/30 cursor-grab active:cursor-grabbing
                      select-none transition-colors"
        >
          <div className="w-8 h-8 rounded-[10px] bg-white/20 flex items-center justify-center flex-shrink-0">
            <RiSparklingFill className="text-white text-sm animate-pulse" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-white text-[12.5px] font-semibold leading-none">Nexora AI</span>
            <span className="text-white/60 text-[10px]">Drag or click to expand</span>
          </div>
          <button
            onMouseDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); close(); }}
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0
                       text-white/60 hover:text-white hover:bg-white/15 transition-colors ml-1 cursor-pointer"
          >
            <RiCloseLine className="text-sm" />
          </button>
        </div>
      )}

      {/* ── Full panel ── */}
      {panelState === "open" && panelDrag.pos && (
        <div
          style={{ position: "fixed", left: panelDrag.pos.x, top: panelDrag.pos.y, zIndex: 50 }}
          className={cn(
            "nc-panel w-[370px] max-h-[590px] flex flex-col",
            "rounded-[20px] border border-teal-200/20 dark:border-teal-800/30 bg-background",
            "shadow-2xl shadow-teal-900/[0.15] dark:shadow-black/50 overflow-hidden"
          )}
        >
          {isLoggedIn
            ? <AuthPanelDraggable
              userName={user.name} role={user.role}
              onMinimize={minimize} onClose={close}
              onMouseDown={panelDrag.onMouseDown}
              onTouchStart={panelDrag.onTouchStart}
            />
            : <GuestPanelDraggable
              onLogin={handleLogin}
              onMinimize={minimize} onClose={close}
              onMouseDown={panelDrag.onMouseDown}
              onTouchStart={panelDrag.onTouchStart}
            />
          }
        </div>
      )}
    </>
  );
}
