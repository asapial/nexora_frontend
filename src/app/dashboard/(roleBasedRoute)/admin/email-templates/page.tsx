"use client";

import { useState } from "react";
import {
  RiSparklingFill, RiMailLine, RiEyeLine, RiSendPlaneLine,
  RiLoader4Line, RiCheckLine, RiCodeLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Template = {
  id: string;
  name: string;
  subject: string;
  description: string;
  body: string;
};

const TEMPLATES: Template[] = [
  {
    id: "teacherWelcome",
    name: "Teacher Welcome",
    subject: "Welcome to Nexora — Your Teacher Account",
    description: "Sent when a new teacher account is created or an existing user is promoted",
    body: `<!DOCTYPE html>
<html>
<body style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#f9fafb;">
  <div style="background:white;border-radius:16px;padding:32px;border:1px solid #e5e7eb;">
    <h1 style="color:#6d28d9;font-size:24px;margin-bottom:8px;">Welcome to Nexora 🎉</h1>
    <p style="color:#6b7280;">Hi <%= name %>,</p>
    <p>Your teacher account is ready. Here are your credentials:</p>
    <div style="background:#f3f4f6;border-radius:8px;padding:16px;margin:16px 0;">
      <p><strong>Email:</strong> <%= email %></p>
      <% if (password) { %>
      <p><strong>Temporary Password:</strong> <%= password %></p>
      <% } %>
    </div>
    <a href="<%= loginUrl %>" style="display:inline-block;background:#6d28d9;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
      Log In Now
    </a>
    <p style="color:#9ca3af;font-size:12px;margin-top:24px;">If you didn't request this, please ignore this email.</p>
  </div>
</body>
</html>`,
  },
  {
    id: "taskReminder",
    name: "Task Reminder",
    subject: "Reminder: Task due soon",
    description: "Sent to students when a task deadline is approaching",
    body: `<!DOCTYPE html>
<html>
<body style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#f9fafb;">
  <div style="background:white;border-radius:16px;padding:32px;border:1px solid #e5e7eb;">
    <h1 style="color:#d97706;font-size:24px;">⏰ Task Reminder</h1>
    <p>Hi <%= name %>,</p>
    <p>Your task <strong><%= taskTitle %></strong> is due on <strong><%= dueDate %></strong>.</p>
    <p>Please make sure to submit before the deadline.</p>
    <a href="<%= taskUrl %>" style="display:inline-block;background:#d97706;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
      View Task
    </a>
  </div>
</body>
</html>`,
  },
  {
    id: "deadlineAlert",
    name: "Deadline Alert",
    subject: "URGENT: Deadline in 24 hours",
    description: "Sent 24 hours before a task or session deadline",
    body: `<!DOCTYPE html>
<html>
<body style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#f9fafb;">
  <div style="background:white;border-radius:16px;padding:32px;border:1px solid #e5e7eb;border-left:4px solid #ef4444;">
    <h1 style="color:#ef4444;font-size:24px;">🚨 Deadline Alert</h1>
    <p>Hi <%= name %>,</p>
    <p><strong><%= itemTitle %></strong> is due in less than 24 hours!</p>
    <a href="<%= itemUrl %>" style="display:inline-block;background:#ef4444;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
      Take Action Now
    </a>
  </div>
</body>
</html>`,
  },
  {
    id: "credentialReset",
    name: "Credential Reset",
    subject: "Nexora — Password Reset",
    description: "Sent when an admin resets a user's password",
    body: `<!DOCTYPE html>
<html>
<body style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#f9fafb;">
  <div style="background:white;border-radius:16px;padding:32px;border:1px solid #e5e7eb;">
    <h1 style="color:#0ea5e9;font-size:24px;">🔐 Password Reset</h1>
    <p>Hi <%= name %>,</p>
    <p>Your password has been reset by an administrator.</p>
    <div style="background:#f0f9ff;border-radius:8px;padding:16px;margin:16px 0;">
      <p><strong>New Password:</strong> <%= password %></p>
    </div>
    <p>Please change your password after logging in.</p>
    <a href="<%= loginUrl %>" style="display:inline-block;background:#0ea5e9;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
      Log In
    </a>
  </div>
</body>
</html>`,
  },
];

export default function EmailTemplatesPage() {
  const [selected, setSelected] = useState<Template>(TEMPLATES[0]);
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(selected.body);
  const [preview, setPreview] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [testEmail, setTestEmail] = useState("");

  const selectTemplate = (t: Template) => {
    setSelected(t);
    setEditBody(t.body);
    setEditing(false);
    setPreview(false);
  };

  const testSend = async () => {
    if (!testEmail.trim()) return;
    setSendLoading(true);
    try {
      // In production, call POST /api/admin/platform/email-templates/:id/test
      await new Promise(r => setTimeout(r, 1200));
      toast.success(`Test email sent to ${testEmail}`);
    } finally {
      setSendLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] max-w-7xl mx-auto w-full">
      {/* Sidebar */}
      <div className="w-64 shrink-0 border-r border-border flex flex-col bg-card/50">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-1.5 mb-1">
            <RiSparklingFill className="text-sky-500 text-sm" />
            <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Admin</span>
          </div>
          <h1 className="text-[14px] font-extrabold text-foreground">Email Templates</h1>
          <p className="text-[11.5px] text-muted-foreground mt-0.5">Edit and preview system emails</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {TEMPLATES.map(t => (
            <button key={t.id} onClick={() => selectTemplate(t)}
              className={cn("w-full p-3.5 flex flex-col items-start text-left hover:bg-muted/30 transition-colors border-b border-border/40 gap-1",
                selected.id === t.id && "bg-sky-50/40 dark:bg-sky-950/10 border-l-2 border-l-sky-500")}>
              <div className="flex items-center gap-2">
                <RiMailLine className={cn("text-sm shrink-0", selected.id === t.id ? "text-sky-500" : "text-muted-foreground/50")} />
                <p className={cn("text-[12.5px] font-semibold", selected.id === t.id ? "text-foreground" : "text-muted-foreground")}>{t.name}</p>
              </div>
              <p className="text-[11px] text-muted-foreground/60 line-clamp-2 ml-5">{t.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Editor / Viewer */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="px-5 py-3.5 border-b border-border bg-card/80 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-foreground truncate">{selected.name}</p>
            <p className="text-[11.5px] text-muted-foreground truncate">Subject: {selected.subject}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => { setEditing(!editing); setPreview(false); }}
              className={cn("h-8 px-3 rounded-xl text-[12px] font-semibold border transition-all flex items-center gap-1.5",
                editing ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:bg-muted/40")}>
              <RiCodeLine className="text-xs" /> {editing ? "Editing" : "Edit"}
            </button>
            <button onClick={() => { setPreview(!preview); setEditing(false); }}
              className={cn("h-8 px-3 rounded-xl text-[12px] font-semibold border transition-all flex items-center gap-1.5",
                preview ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:bg-muted/40")}>
              <RiEyeLine className="text-xs" /> Preview
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {preview ? (
            <div className="p-6 h-full">
              <div className="rounded-xl border border-border overflow-hidden shadow-sm h-full">
                <iframe
                  srcDoc={editing ? editBody : selected.body}
                  className="w-full h-full border-0"
                  title="Email preview"
                />
              </div>
            </div>
          ) : editing ? (
            <div className="p-4 h-full flex flex-col gap-3">
              <textarea
                value={editBody}
                onChange={e => setEditBody(e.target.value)}
                className="flex-1 w-full px-4 py-3 rounded-xl border border-border bg-muted/20 text-[12.5px] font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-sky-400/25 resize-none transition-all"
              />
              <button
                onClick={() => { toast.success("Template saved (client-side)"); setEditing(false); }}
                className="h-10 w-fit px-5 rounded-xl bg-sky-600 dark:bg-sky-500 hover:bg-sky-700 text-white text-[12.5px] font-bold flex items-center gap-1.5 transition-all">
                <RiCheckLine /> Save template
              </button>
            </div>
          ) : (
            <div className="p-6">
              <div className="rounded-xl border border-border bg-muted/10 p-4">
                <pre className="text-[12px] font-mono text-muted-foreground whitespace-pre-wrap leading-relaxed">{selected.body}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Test send */}
        <div className="border-t border-border px-5 py-4 bg-card/80">
          <p className="text-[11.5px] font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
            <RiSendPlaneLine /> Test Send
          </p>
          <div className="flex gap-2">
            <input value={testEmail} onChange={e => setTestEmail(e.target.value)}
              placeholder="admin@example.com"
              className="flex-1 h-9 px-3 rounded-xl border border-border bg-muted/30 text-[12.5px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all" />
            <button onClick={testSend} disabled={sendLoading || !testEmail.trim()}
              className="h-9 px-4 rounded-xl bg-sky-600 dark:bg-sky-500 hover:bg-sky-700 disabled:opacity-50 text-white text-[12px] font-bold flex items-center gap-1.5 transition-all">
              {sendLoading ? <RiLoader4Line className="animate-spin" /> : <RiSendPlaneLine />}
              Send test
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
