"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { emitMascotEvent } from "@/lib/mascot/eventBus";

export interface ChatMessage { id: string; role: "user" | "assistant"; content: string; timestamp: Date; }
export interface NimbiActionCard { id: string; actionKey: string; label: string; description: string; route?: string; requiresConfirmation: boolean; executionToken?: string; }
export interface ConversationSummary { id: string; title: string; roleSnapshot: string; lastMessageAt: string | null; updatedAt: string; }
export interface NimbiPageContext { pathname: string; featureId?: string; entityType?: "course" | "cluster" | "resource" | "task" | "goal" | "exam" | "notice"; entityId?: string; }

const GUEST_KEY = "nexora_guest_chat";
const GUEST_LIMIT = 3;
const parseMessages = (raw: string | null): ChatMessage[] => { try { return raw ? JSON.parse(raw).map((m: ChatMessage) => ({ ...m, timestamp: new Date(m.timestamp) })) : []; } catch { return []; } };
const saveGuest = (messages: ChatMessage[]) => { try { localStorage.setItem(GUEST_KEY, JSON.stringify(messages.slice(-12))); } catch { /* private mode */ } };

export function useNimbiChat(user?: { id?: string; name?: string; role?: string } | null) {
  const pathname = usePathname() || "/";
  const authenticated = Boolean(user?.id);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [actions, setActions] = useState<NimbiActionCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => { if (!authenticated) { setMessages(parseMessages(typeof window === "undefined" ? null : localStorage.getItem(GUEST_KEY))); } else { setMessages([]); setConversationId(undefined); void fetch("/api/ai/conversations", { credentials: "include" }).then(r => r.ok ? r.json() : null).then(d => d?.data?.items && setConversations(d.data.items)).catch(() => undefined); } }, [authenticated, user?.id]);

  const loadConversation = useCallback(async (id: string) => { const res = await fetch(`/api/ai/conversations/${id}/messages`, { credentials: "include" }); const data = await res.json(); if (!res.ok) throw new Error(data.message || "Could not load thread"); setConversationId(id); setActions([]); setMessages((data.data.items || []).map((m: { id: string; role: string; content: string; createdAt: string }) => ({ id: m.id, role: m.role === "USER" ? "user" : "assistant", content: m.content, timestamp: new Date(m.createdAt) }))); }, []);
  const newConversation = useCallback(() => { abortRef.current?.abort(); setConversationId(undefined); setMessages([]); setActions([]); setError(null); }, []);
  const deleteConversation = useCallback(async (id: string) => { await fetch(`/api/ai/conversations/${id}`, { method: "DELETE", credentials: "include" }); setConversations(items => items.filter(item => item.id !== id)); if (conversationId === id) newConversation(); }, [conversationId, newConversation]);
  const stop = useCallback(() => abortRef.current?.abort(), []);

  const sendMessage = useCallback(async (content: string) => {
    const text = content.trim(); if (!text || loading || (!authenticated && messages.filter(m => m.role === "user").length >= GUEST_LIMIT)) return;
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text, timestamp: new Date() };
    const assistantMessage: ChatMessage = { id: crypto.randomUUID(), role: "assistant", content: "", timestamp: new Date() };
    setMessages(items => [...items, userMessage, assistantMessage]); setActions([]); setError(null); setLoading(true); emitMascotEvent("chat_message_sent"); emitMascotEvent("chat_response_started");
    const controller = new AbortController(); abortRef.current = controller;
    try {
      const res = await fetch("/api/ai/chat/stream", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", signal: controller.signal, body: JSON.stringify({ message: text, conversationId, clientMessageId: userMessage.id, pageContext: { pathname }, ...(!authenticated ? { history: messages.slice(-6).map(m => ({ role: m.role, content: m.content })) } : {}) }) });
      if (!res.ok) { const data = await res.json().catch(() => null); if (data?.data?.loginRequired) setLimitReached(true); throw new Error(data?.message || "Nimbi could not respond"); }
      const reader = res.body?.getReader(); if (!reader) throw new Error("Streaming is unavailable in this browser"); const decoder = new TextDecoder(); let buffer = "";
      const consume = (line: string) => { if (!line.trim()) return; const event = JSON.parse(line); if (event.type === "meta" && event.conversationId) setConversationId(event.conversationId); if (event.type === "delta") setMessages(items => items.map(m => m.id === assistantMessage.id ? { ...m, content: m.content + event.text } : m)); if (event.type === "actions") setActions(event.actions || []); if (event.type === "error") throw new Error(event.message); };
      while (true) { const { value, done } = await reader.read(); if (done) break; buffer += decoder.decode(value, { stream: true }); const lines = buffer.split("\n"); buffer = lines.pop() || ""; lines.forEach(consume); }
      if (buffer) consume(buffer); emitMascotEvent("chat_response_finished");
      setMessages(items => { if (!authenticated) saveGuest(items); return items; });
    } catch (err) { if ((err as Error).name !== "AbortError") { setError((err as Error).message || "Failed to get response"); emitMascotEvent("chat_error", { message: (err as Error).message }); } }
    finally { setLoading(false); abortRef.current = null; }
  }, [authenticated, conversationId, loading, messages, pathname]);

  const confirmAction = useCallback(async (action: NimbiActionCard) => {
    if (action.route) return action.route;
    if (!action.executionToken) return null;
    if (!window.confirm(`${action.label}?`)) return null;
    const res = await fetch("/api/ai/actions/execute", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ executionToken: action.executionToken, idempotencyKey: crypto.randomUUID() }) });
    const data = await res.json(); if (!res.ok) throw new Error(data.message || "Action failed"); emitMascotEvent("chat_response_finished"); return data.data;
  }, []);

  return { messages, loading, error, sendMessage, clearMessages: newConversation, limitReached: limitReached || messages.filter(m => m.role === "user").length >= GUEST_LIMIT, userMessageCount: messages.filter(m => m.role === "user").length, conversationId, conversations, actions, loadConversation, newConversation, deleteConversation, stop, confirmAction };
}

export const useAuthChat = (user?: { id?: string; name?: string; role?: string } | null) => useNimbiChat(user);
export const useGuestChat = () => useNimbiChat(null);
