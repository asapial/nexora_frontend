"use client";
import { useState, useCallback, useEffect } from "react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const STORAGE_KEY_AUTH   = "nexora_chat_messages";
const STORAGE_KEY_GUEST  = "nexora_guest_chat";
const GUEST_LIMIT        = 3;

function loadFromStorage(key: string): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
  } catch { return []; }
}

function saveToStorage(key: string, messages: ChatMessage[]) {
  if (typeof window === "undefined") return;
  try {
    // Keep last 50 messages only
    localStorage.setItem(key, JSON.stringify(messages.slice(-50)));
  } catch {}
}

// ── Authenticated chat hook ────────────────────────────────
export function useAuthChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    loadFromStorage(STORAGE_KEY_AUTH)
  );
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    const updated = [...messages, userMsg];
    setMessages(updated);
    saveToStorage(STORAGE_KEY_AUTH, updated);
    setLoading(true);
    setError(null);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: content.trim(), history }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Something went wrong");

      const aiMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.data.reply,
        timestamp: new Date(),
      };

      const withAI = [...updated, aiMsg];
      setMessages(withAI);
      saveToStorage(STORAGE_KEY_AUTH, withAI);
    } catch (err: any) {
      setError(err.message || "Failed to get response");
    } finally {
      setLoading(false);
    }
  }, [messages, loading]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY_AUTH);
    setError(null);
  }, []);

  return { messages, loading, error, sendMessage, clearMessages };
}

// ── Guest chat hook ────────────────────────────────────────
export function useGuestChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    loadFromStorage(STORAGE_KEY_GUEST)
  );
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  // Count only user messages
  const userMessageCount = messages.filter(m => m.role === "user").length;
  const limitReached     = userMessageCount >= GUEST_LIMIT;

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || loading || limitReached) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    const updated = [...messages, userMsg];
    setMessages(updated);
    saveToStorage(STORAGE_KEY_GUEST, updated);
    setLoading(true);
    setError(null);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/ai/guest-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content.trim(), history }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Something went wrong");

      const aiMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.data.reply,
        timestamp: new Date(),
      };

      const withAI = [...updated, aiMsg];
      setMessages(withAI);
      saveToStorage(STORAGE_KEY_GUEST, withAI);
    } catch (err: any) {
      setError(err.message || "Failed to get response");
    } finally {
      setLoading(false);
    }
  }, [messages, loading, limitReached]);

  return { messages, loading, error, sendMessage, limitReached, userMessageCount };
}