"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useEffect, useState } from "react";
import { RiAddLine, RiAlertLine, RiCheckLine, RiCloseLine, RiEyeLine, RiLoader4Line, RiShieldCheckLine, RiTimeLine, RiUserLine } from "react-icons/ri";
import { toast } from "sonner";
import { examApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { examFormSchema } from "@/lib/formSchemas";

type Question = { type: "MCQ" | "CQ"; prompt: string; marks: number; explanation: string; options: { text: string; isCorrect: boolean; }[]; };
const emptyQuestion = (): Question => ({ type: "MCQ", prompt: "", marks: 1, explanation: "", options: [{ text: "", isCorrect: true }, { text: "", isCorrect: false }, { text: "", isCorrect: false }, { text: "", isCorrect: false }] });
const field = "w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-teal-400/20";
const fmt = (d: string) => new Date(d).toLocaleString();

function Status({ value }: { value: string; }) {
  const cls = value === "APPROVED" ? "text-teal-600 bg-teal-500/10 border-teal-500/20" : value === "REJECTED" ? "text-rose-600 bg-rose-500/10 border-rose-500/20" : "text-amber-600 bg-amber-500/10 border-amber-500/20";
  return <span className={cn("rounded-full border px-2.5 py-1 text-[10px] font-bold", cls)}>{value.replaceAll("_", " ")}</span>;
}

export default function TeacherExamsPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [clusters, setClusters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [monitor, setMonitor] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({ title: "", description: "", clusterId: "", type: "MIXED", startTime: "", endTime: "", durationMinutes: 60 });
  const [questions, setQuestions] = useState<Question[]>([emptyQuestion()]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [examRes, clusterRes] = await Promise.all([examApi.teacherList(), fetch("/api/cluster", { credentials: "include" }).then(r => r.json())]);
      setExams(examRes.data ?? []);
      setClusters(Array.isArray(clusterRes.data) ? clusterRes.data : []);
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!monitor?.id) return;
    const poll = async () => { try { setMonitor((await examApi.teacherDetail(monitor.id)).data); } catch { } };
    poll();
    const timer = setInterval(poll, 4000);
    return () => clearInterval(timer);
  }, [monitor?.id]);

  const updateQuestion = (index: number, patch: Partial<Question>) => setQuestions(p => p.map((q, i) => i === index ? { ...q, ...patch } : q));
  const save = async () => {
    const parsed = examFormSchema.safeParse({ ...form, questions });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the exam fields");
      return;
    }
    setSaving(true);
    try {
      await examApi.create({
        ...parsed.data, startTime: new Date(parsed.data.startTime).toISOString(), endTime: new Date(parsed.data.endTime).toISOString(),
        questions: parsed.data.questions.map(q => ({ ...q, options: q.type === "CQ" ? [] : q.options })),
      });
      toast.success("Exam submitted for admin approval");
      setShowCreate(false); setQuestions([emptyQuestion()]); await load();
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  return (
    <div className="flex flex-col gap-6 p-5 lg:p-8 max-w-6xl mx-auto w-full">
      <div className="flex items-start justify-between gap-4">
        <div><div className="flex items-center gap-2 text-[10px] font-bold tracking-[.14em] uppercase text-teal-600"><RiShieldCheckLine /> ExamShield</div><h1 className="text-2xl font-extrabold mt-1">Exams & Live Proctoring</h1><p className="text-[13px] text-muted-foreground mt-1">Build cluster exams, track approval, and monitor integrity events.</p></div>
        <button onClick={() => setShowCreate(true)} className="h-10 px-4 rounded-xl bg-teal-600 text-white text-[12px] font-bold flex items-center gap-2"><RiAddLine /> Create exam</button>
      </div>

      {loading ? <div className="grid md:grid-cols-3 gap-4">{[1, 2, 3].map(i => <div key={i} className="h-44 rounded-2xl bg-muted animate-pulse" />)}</div> :
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{exams.map(exam => (
          <div key={exam.id} className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-3 hover:border-teal-400/40 transition-colors">
            <div className="flex justify-between gap-2"><div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center"><RiShieldCheckLine /></div><Status value={exam.status} /></div>
            <div><h3 className="font-extrabold text-[14px]">{exam.title}</h3><p className="text-[12px] text-muted-foreground">{exam.cluster?.name} · {exam.type}</p></div>
            <div className="text-[11px] text-muted-foreground space-y-1"><p className="flex gap-1.5 items-center"><RiTimeLine /> {fmt(exam.startTime)}</p><p>{exam._count.questions} questions · {exam._count.attempts}/{exam._count.assignments} attempts</p></div>
            {exam.rejectionReason && <p className="text-[11px] text-rose-600 bg-rose-500/10 rounded-lg p-2">{exam.rejectionReason}</p>}
            <button onClick={() => setMonitor({ id: exam.id })} className="mt-auto h-9 rounded-xl border border-border text-[12px] font-bold hover:bg-muted flex items-center justify-center gap-2"><RiEyeLine /> Monitor & review</button>
          </div>
        ))}</div>}

      {showCreate && <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto my-6 rounded-2xl border border-border bg-card shadow-2xl">
          <div className="p-5 border-b border-border flex justify-between"><div><h2 className="font-extrabold">Create proctored exam</h2><p className="text-[11px] text-muted-foreground">Start time must be at least 24 hours away.</p></div><button onClick={() => setShowCreate(false)}><RiCloseLine /></button></div>
          <div className="p-5 space-y-4">
            <div className="grid md:grid-cols-2 gap-3"><input className={field} placeholder="Exam title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /><select className={field} value={form.clusterId} onChange={e => setForm({ ...form, clusterId: e.target.value })}><option value="">Select cluster</option>{clusters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select><select className={field} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option>MCQ</option><option>CQ</option><option>MIXED</option></select><input className={field} type="number" value={form.durationMinutes} onChange={e => setForm({ ...form, durationMinutes: e.target.value })} placeholder="Duration minutes" /><input className={field} type="datetime-local" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} /><input className={field} type="datetime-local" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} /></div>
            <textarea className={field} placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            <div className="flex justify-between items-center"><h3 className="font-bold text-[13px]">Questions</h3><button onClick={() => setQuestions(p => [...p, emptyQuestion()])} className="text-[12px] font-bold text-teal-600 flex gap-1 items-center"><RiAddLine /> Add question</button></div>
            {questions.map((q, qi) => <div key={qi} className="rounded-xl border border-border p-4 space-y-3 bg-muted/10">
              <div className="flex gap-2"><select className={field} value={q.type} onChange={e => updateQuestion(qi, { type: e.target.value as any })}><option>MCQ</option><option>CQ</option></select><input className={field} type="number" value={q.marks} onChange={e => updateQuestion(qi, { marks: Number(e.target.value) })} /><button onClick={() => setQuestions(p => p.filter((_, i) => i !== qi))} className="px-3 text-rose-500"><RiCloseLine /></button></div>
              <textarea className={field} placeholder={`Question ${qi + 1}`} value={q.prompt} onChange={e => updateQuestion(qi, { prompt: e.target.value })} />
              {q.type === "MCQ" && q.options.map((o, oi) => <div key={oi} className="flex gap-2 items-center"><input type="radio" checked={o.isCorrect} onChange={() => updateQuestion(qi, { options: q.options.map((x, i) => ({ ...x, isCorrect: i === oi })) })} /><input className={field} placeholder={`Option ${oi + 1}`} value={o.text} onChange={e => updateQuestion(qi, { options: q.options.map((x, i) => i === oi ? { ...x, text: e.target.value } : x) })} /></div>)}
            </div>)}
          </div>
          <div className="p-5 border-t border-border"><button onClick={save} disabled={saving} className="w-full h-11 rounded-xl bg-teal-600 text-white font-bold text-[13px] flex items-center justify-center gap-2">{saving ? <RiLoader4Line className="animate-spin" /> : <RiCheckLine />} Submit for approval</button></div>
        </div>
      </div>}

      {monitor && <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"><div className="max-w-4xl mx-auto my-6 rounded-2xl bg-card border border-border shadow-2xl">
        <div className="p-5 border-b border-border flex justify-between"><div><h2 className="font-extrabold">{monitor.title ?? "Loading monitor..."}</h2><p className="text-[11px] text-muted-foreground">Refreshes every 4 seconds</p></div><button onClick={() => setMonitor(null)}><RiCloseLine /></button></div>
        <div className="p-5 grid md:grid-cols-2 gap-4">{monitor.attempts?.map((a: any) => <div key={a.id} className={cn("rounded-xl border p-4", a.suspicious ? "border-rose-300 bg-rose-500/5" : "border-border")}><div className="flex justify-between"><div><p className="font-bold text-[13px] flex gap-1 items-center"><RiUserLine />{a.user.name}</p><p className="text-[11px] text-muted-foreground">{a.status} · Score {a.score ?? "pending"}/{a.totalMarks ?? "?"}</p></div><span className="text-[11px] font-bold text-rose-600">{a.suspiciousCount} violations</span></div>{a.proctorEvents.slice(0, 4).map((v: any) => <p key={v.id} className="mt-2 text-[11px] text-rose-600 flex gap-1"><RiAlertLine />{v.type.replaceAll("_", " ")} · {fmt(v.occurredAt)}</p>)}</div>)}</div>
      </div></div>}
    </div>
  );
}
