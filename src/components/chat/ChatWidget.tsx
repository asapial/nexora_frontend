"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  RiSparklingFill, RiCloseLine, RiSendPlaneFill,
  RiDeleteBinLine, RiRobot2Line, RiUser3Line,
  RiLoginBoxLine, RiLockLine, RiMessage3Line,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import { useAuthChat, useGuestChat, ChatMessage } from "@/hooks/useChat";

const QUICK_CHIPS: Record<string, string[]> = {
  STUDENT: ["My courses", "Pending tasks?", "Who is my teacher?", "Next session?"],
  TEACHER: ["List my clusters", "How many students?", "My courses", "Upcoming sessions"],
  ADMIN:   ["Total users", "Active courses", "How many teachers?", "Recent activity"],
  GUEST:   ["What is Nexora?", "How does it work?", "What can teachers do?"],
};

// ── Typing dots ────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="w-[26px] h-[26px] rounded-[10px] flex-shrink-0 flex items-center justify-center
                      bg-violet-50 dark:bg-violet-950/50
                      border border-violet-100 dark:border-violet-800/50
                      text-violet-600 dark:text-violet-400 text-xs">
        <RiRobot2Line />
      </div>
      <div className="px-3.5 py-2.5 rounded-2xl rounded-bl-sm bg-muted/60 border border-border/60 flex items-center gap-1">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="w-[5px] h-[5px] rounded-full bg-teal-500 dark:bg-teal-400"
            style={{ animation: `ncBounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Message bubble ─────────────────────────────────────────
function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <div className={cn("flex items-end gap-2", isUser && "flex-row-reverse")}>
      <div className={cn(
        "w-[26px] h-[26px] rounded-[10px] flex-shrink-0 flex items-center justify-center text-xs",
        isUser
          ? "bg-teal-50 dark:bg-teal-950/50 border border-teal-100 dark:border-teal-800/50 text-teal-600 dark:text-teal-400"
          : "bg-violet-50 dark:bg-violet-950/50 border border-violet-100 dark:border-violet-800/50 text-violet-600 dark:text-violet-400"
      )}>
        {isUser ? <RiUser3Line /> : <RiRobot2Line />}
      </div>
      <div className={cn(
        "max-w-[79%] px-3.5 py-2.5 text-[12.5px] leading-relaxed",
        isUser
          ? "rounded-2xl rounded-br-sm bg-teal-600 dark:bg-teal-500 text-white"
          : "rounded-2xl rounded-bl-sm bg-muted/60 border border-border/60 text-foreground"
      )}>
        {msg.content.split("\n").map((line, i) => (
          <p key={i} className={line === "" ? "h-2" : ""}>{line}</p>
        ))}
        <p className={cn(
          "text-[10px] mt-1.5 select-none opacity-60",
          isUser ? "text-right" : ""
        )}>
          {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}

// ── Guest limit wall ───────────────────────────────────────
function GuestLimitWall({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="mx-0.5 my-1 rounded-2xl
                    border border-amber-200/50 dark:border-amber-800/40
                    bg-amber-50/60 dark:bg-amber-950/20
                    px-4 py-4 flex flex-col items-center gap-3 text-center">
      <div className="w-9 h-9 rounded-[10px] flex items-center justify-center
                      bg-amber-100/60 dark:bg-amber-950/50
                      border border-amber-200/50 dark:border-amber-800/40
                      text-amber-600 dark:text-amber-400">
        <RiLockLine className="text-base" />
      </div>
      <div>
        <p className="text-[13px] font-medium text-foreground mb-1">
          You've used your 3 free messages
        </p>
        <p className="text-[11.5px] text-muted-foreground leading-relaxed">
          Log in to unlock unlimited chat with your personal Nexora data.
        </p>
      </div>
      <button
        onClick={onLogin}
        className="inline-flex items-center gap-2 h-8 px-5 rounded-full
                   bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-600
                   text-white text-[12px] font-medium transition-all hover:scale-[1.03]"
      >
        <RiLoginBoxLine className="text-sm" />
        Log in to continue
      </button>
    </div>
  );
}

// ── Auth chat panel ────────────────────────────────────────
function AuthChatPanel({
  userName,
  role,
}: {
  userName: string;
  role: "STUDENT" | "TEACHER" | "ADMIN";
}) {
  const [input, setInput] = useState("");
  const { messages, loading, error, sendMessage, clearMessages } = useAuthChat();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  const chips     = QUICK_CHIPS[role] || [];

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 150); }, []);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
  };

  const roleBadge = {
    ADMIN:   "bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 border-violet-100 dark:border-violet-800/50",
    TEACHER: "bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border-teal-100 dark:border-teal-800/50",
    STUDENT: "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border-sky-100 dark:border-sky-800/50",
  }[role];

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-[13px]
                      border-b border-border/60 bg-background/95 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-[12px] flex items-center justify-center
                          bg-violet-50 dark:bg-violet-950/50
                          border border-violet-100 dark:border-violet-800/50
                          text-violet-600 dark:text-violet-400">
            <RiSparklingFill className="text-base animate-pulse" />
          </div>
          <div>
            <p className="text-[13.5px] font-medium text-foreground leading-none mb-1">Nexora AI</p>
            <div className="flex items-center gap-1.5">
              <span className="w-[6px] h-[6px] rounded-full bg-teal-500 animate-pulse" />
              <span className="text-[10.5px] text-muted-foreground">Online · Chat saved</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-[10px] font-medium tracking-wide uppercase px-2 py-[3px] rounded-md border",
            roleBadge
          )}>
            {role.charAt(0) + role.slice(1).toLowerCase()}
          </span>
          {messages.length > 0 && (
            <button
              onClick={clearMessages}
              className="w-[30px] h-[30px] rounded-lg flex items-center justify-center
                         text-muted-foreground/50 hover:text-red-500
                         hover:bg-red-50/60 dark:hover:bg-red-950/30 transition-colors"
              title="Clear chat"
            >
              <RiDeleteBinLine className="text-sm" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2.5 min-h-0
                      scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border/40">
        {messages.length === 0 && (
          <div className="flex flex-col items-center text-center gap-3 pt-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center
                            bg-violet-50 dark:bg-violet-950/50
                            border border-violet-100 dark:border-violet-800/50
                            text-violet-600 dark:text-violet-400 text-xl">
              <RiMessage3Line />
            </div>
            <div>
              <p className="text-[14px] font-medium text-foreground mb-1">
                Hi {userName.split(" ")[0]} 👋
              </p>
              <p className="text-[12px] text-muted-foreground leading-relaxed">
                Ask me anything about your{" "}
                {role === "STUDENT" ? "courses, tasks & sessions"
                  : role === "TEACHER" ? "clusters, students & courses"
                  : "platform stats & users"}.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 justify-center mt-1">
              {chips.map(chip => (
                <button
                  key={chip}
                  onClick={() => sendMessage(chip)}
                  className="px-3 py-[6px] rounded-full text-[11.5px] font-medium
                             border border-border/60 bg-muted/40 text-muted-foreground
                             hover:border-teal-200/80 dark:hover:border-teal-700/60
                             hover:text-teal-600 dark:hover:text-teal-400
                             hover:bg-teal-50/60 dark:hover:bg-teal-950/20 transition-all"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
        {loading && <TypingIndicator />}
        {error && (
          <p className="text-[11.5px] text-red-500 dark:text-red-400 text-center px-2">
            ⚠ {error}
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-3 border-t border-border/60 bg-background/95 flex-shrink-0">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Ask anything…"
            disabled={loading}
            className={cn(
              "flex-1 h-[38px] px-4 rounded-full text-[12.5px]",
              "bg-muted/50 border border-border/60",
              "focus:border-teal-400/60 dark:focus:border-teal-500/50",
              "focus:ring-[3px] focus:ring-teal-400/15 focus:outline-none",
              "text-foreground placeholder:text-muted-foreground/50 transition-all",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="w-[38px] h-[38px] rounded-full flex items-center justify-center flex-shrink-0
                       bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 text-white
                       transition-all hover:scale-105 active:scale-95
                       disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:scale-100
                       shadow-sm shadow-teal-600/25"
          >
            <RiSendPlaneFill className="text-sm" />
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground/40 text-center mt-2">
          Nexora AI · Powered by your live data
        </p>
      </div>
    </>
  );
}

// ── Guest chat panel ───────────────────────────────────────
function GuestChatPanel({ onLogin }: { onLogin: () => void }) {
  const [input, setInput] = useState("");
  const { messages, loading, error, sendMessage, limitReached, userMessageCount } = useGuestChat();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 150); }, []);

  const handleSend = () => {
    if (!input.trim() || limitReached) return;
    sendMessage(input);
    setInput("");
  };
  const remaining = Math.max(0, 3 - userMessageCount);

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-[13px]
                      border-b border-border/60 bg-background/95 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-[12px] flex items-center justify-center
                          bg-violet-50 dark:bg-violet-950/50
                          border border-violet-100 dark:border-violet-800/50
                          text-violet-600 dark:text-violet-400">
            <RiSparklingFill className="text-base animate-pulse" />
          </div>
          <div>
            <p className="text-[13.5px] font-medium text-foreground leading-none mb-1">Nexora AI</p>
            <div className="flex items-center gap-1.5">
              <span className="w-[6px] h-[6px] rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[10.5px] text-muted-foreground">
                Guest · {remaining} message{remaining !== 1 ? "s" : ""} left
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={onLogin}
          className="inline-flex items-center gap-1.5 h-[28px] px-3 rounded-lg text-[11.5px] font-medium
                     border border-teal-200/70 dark:border-teal-700/60
                     text-teal-600 dark:text-teal-400 bg-teal-50/70 dark:bg-teal-950/30
                     hover:bg-teal-100/70 dark:hover:bg-teal-950/50 transition-all"
        >
          <RiLoginBoxLine className="text-xs" />
          Log in
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2.5 min-h-0
                      scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border/40">
        {messages.length === 0 && (
          <div className="flex flex-col items-center text-center gap-3 pt-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center
                            bg-violet-50 dark:bg-violet-950/50
                            border border-violet-100 dark:border-violet-800/50
                            text-violet-600 dark:text-violet-400 text-xl">
              <RiMessage3Line />
            </div>
            <div>
              <p className="text-[14px] font-medium text-foreground mb-1">Hi there 👋</p>
              <p className="text-[12px] text-muted-foreground leading-relaxed">
                I'm Nexora AI. You have{" "}
                <span className="font-medium text-amber-500 dark:text-amber-400">3 free messages</span>.
                Log in for unlimited personalized help.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 justify-center mt-1">
              {QUICK_CHIPS.GUEST.map(chip => (
                <button
                  key={chip}
                  onClick={() => sendMessage(chip)}
                  disabled={limitReached}
                  className="px-3 py-[6px] rounded-full text-[11.5px] font-medium
                             border border-border/60 bg-muted/40 text-muted-foreground
                             hover:border-teal-200/80 hover:text-teal-600
                             hover:bg-teal-50/60 dark:hover:bg-teal-950/20 transition-all
                             disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
        {loading && <TypingIndicator />}
        {error && (
          <p className="text-[11.5px] text-red-500 dark:text-red-400 text-center px-2">
            ⚠ {error}
          </p>
        )}
        {limitReached && <GuestLimitWall onLogin={onLogin} />}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-3 border-t border-border/60 bg-background/95 flex-shrink-0">
        {!limitReached ? (
          <>
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="Ask anything…"
                disabled={loading}
                className={cn(
                  "flex-1 h-[38px] px-4 rounded-full text-[12.5px]",
                  "bg-muted/50 border border-border/60",
                  "focus:border-teal-400/60 focus:ring-[3px] focus:ring-teal-400/15 focus:outline-none",
                  "text-foreground placeholder:text-muted-foreground/50 transition-all",
                  "disabled:opacity-50"
                )}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="w-[38px] h-[38px] rounded-full flex items-center justify-center
                           bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 text-white
                           transition-all hover:scale-105 active:scale-95
                           disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:scale-100
                           shadow-sm shadow-teal-600/25"
              >
                <RiSendPlaneFill className="text-sm" />
              </button>
            </div>
            {/* Progress bar */}
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-[2px] rounded-full bg-border/40 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-400 transition-all duration-500"
                  style={{ width: `${(userMessageCount / 3) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground/50 tabular-nums flex-shrink-0">
                {userMessageCount}/3
              </span>
            </div>
          </>
        ) : (
          <button
            onClick={onLogin}
            className="w-full h-[38px] rounded-full flex items-center justify-center gap-2
                       bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 text-white
                       text-[13px] font-medium transition-all hover:scale-[1.01]"
          >
            <RiLoginBoxLine />
            Log in for unlimited chat
          </button>
        )}
        <p className="text-[10px] text-muted-foreground/40 text-center mt-2">
          Nexora AI · Powered by your live data
        </p>
      </div>
    </>
  );
}

// ── Root widget ────────────────────────────────────────────
interface ChatWidgetProps {
  user?: { name: string; role: "STUDENT" | "TEACHER" | "ADMIN" } | null;
  loginPath?: string;
}

export default function ChatWidget({ user, loginPath = "/auth/signin" }: ChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const router     = useRouter();
  const isLoggedIn = !!user;

  const handleLogin = () => {
    setOpen(false);
    router.push(loginPath);
  };

  return (
    <>
      <style>{`
        @keyframes ncBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
        @keyframes ncSlideUp {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .nc-panel { animation: ncSlideUp 0.22s cubic-bezier(0.22, 1, 0.36, 1); }
      `}</style>

      {/* Floating button */}
      <button
        onClick={() => setOpen(p => !p)}
        className={cn(
          "fixed bottom-6 right-6 z-50 w-[54px] h-[54px] rounded-[18px]",
          "bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-600",
          "text-white shadow-lg shadow-teal-600/30",
          "flex items-center justify-center text-xl",
          "transition-all duration-200 hover:scale-[1.06] active:scale-95"
        )}
      >
        {open
          ? <RiCloseLine className="text-xl" />
          : <RiSparklingFill className="text-xl animate-pulse" />
        }
        {/* Guest badge */}
        {!open && !isLoggedIn && (
          <span className="absolute -top-1 -right-1 w-[18px] h-[18px] rounded-full
                           bg-amber-400 border-[2.5px] border-background
                           flex items-center justify-center
                           text-[9px] font-bold text-amber-900">3</span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className={cn(
          "nc-panel fixed bottom-[76px] right-6 z-50",
          "w-[364px] max-h-[580px] flex flex-col",
          "rounded-[20px] border border-border/60 bg-background",
          "shadow-2xl shadow-black/[0.18] dark:shadow-black/50 overflow-hidden"
        )}>
          {isLoggedIn
            ? <AuthChatPanel userName={user.name} role={user.role} />
            : <GuestChatPanel onLogin={handleLogin} />
          }
        </div>
      )}
    </>
  );
}