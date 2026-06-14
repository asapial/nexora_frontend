"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  RiAddLine, RiArrowLeftLine, RiCheckLine, RiCloseLine, RiFileList3Line,
  RiCameraLine, RiInformationLine, RiLoader4Line, RiQuestionLine, RiShieldCheckLine,
  RiSparklingFill, RiTimeLine,
} from "react-icons/ri";
import { toast } from "sonner";
import { examApi } from "@/lib/api";
import { ClusterOption } from "@/lib/examShield";
import { examFormSchema, normalizeExamFormInput } from "@/lib/formSchemas";
import { cn } from "@/lib/utils";

type Question = {
  type: "MCQ" | "CQ";
  prompt: string;
  marks: number;
  explanation: string;
  options: Array<{ text: string; isCorrect: boolean }>;
};

type FormState = {
  title: string;
  description: string;
  clusterId: string;
  type: "MCQ" | "CQ" | "MIXED";
  examMode: "REGULAR" | "PRO";
  startTime: string;
  endTime: string;
  durationMinutes: number;
};

const inputClass = "w-full rounded-xl border border-border bg-muted/30 px-4 py-3 text-[13px] font-medium text-foreground outline-none transition focus:border-teal-500/60 focus:ring-4 focus:ring-teal-500/10";
const emptyQuestion = (type: "MCQ" | "CQ" = "MCQ"): Question => ({
  type,
  prompt: "",
  marks: 1,
  explanation: "",
  options: type === "MCQ"
    ? [{ text: "", isCorrect: true }, { text: "", isCorrect: false }, { text: "", isCorrect: false }, { text: "", isCorrect: false }]
    : [],
});

function Section({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card/95 shadow-sm backdrop-blur-sm">
      <div className="flex gap-3 border-b border-border px-5 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-teal-500/20 bg-teal-500/10 text-teal-600">{icon}</div>
        <div><h2 className="text-[14px] font-extrabold">{title}</h2><p className="mt-0.5 text-[11px] text-muted-foreground">{description}</p></div>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export default function CreateExamPage() {
  const router = useRouter();
  const [clusters, setClusters] = useState<ClusterOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [form, setForm] = useState<FormState>({
    title: "",
    description: "",
    clusterId: "",
    type: "MCQ",
    examMode: "REGULAR",
    startTime: "",
    endTime: "",
    durationMinutes: 60,
  });
  const [questions, setQuestions] = useState<Question[]>([emptyQuestion()]);
  const [proctorPolicy, setProctorPolicy] = useState({
    cameraRequired: true,
    snapshotEnabled: true,
    sensitivity: "STANDARD" as "RELAXED" | "STANDARD" | "STRICT",
    studentWarnings: true,
    roughPaperAllowed: true,
    evidenceRetentionDays: 30 as 7 | 30 | 90,
  });

  useEffect(() => {
    fetch("/api/cluster", { credentials: "include" })
      .then((response) => response.json())
      .then((payload) => setClusters(Array.isArray(payload.data) ? payload.data : []))
      .catch(() => toast.error("Could not load your clusters"));
  }, []);

  const totalMarks = useMemo(() => questions.reduce((sum, question) => sum + Number(question.marks || 0), 0), [questions]);
  const completeQuestions = useMemo(() => questions.filter((question) =>
    question.prompt.trim() && (question.type === "CQ" || (
      question.options.filter((option) => option.text.trim()).length >= 2 &&
      question.options.filter((option) => option.isCorrect).length === 1
    ))
  ).length, [questions]);
  const readiness = Math.round(([
    form.title.trim().length >= 3,
    Boolean(form.clusterId),
    Boolean(form.startTime && form.endTime),
    completeQuestions === questions.length && questions.length > 0,
  ].filter(Boolean).length / 4) * 100);

  const updateQuestion = (index: number, patch: Partial<Question>) =>
    setQuestions((current) => current.map((question, questionIndex) => questionIndex === index ? { ...question, ...patch } : question));

  const changeQuestionType = (index: number, type: "MCQ" | "CQ") => {
    const current = questions[index];
    updateQuestion(index, {
      type,
      options: type === "MCQ"
        ? (current?.options.length ? current.options : emptyQuestion("MCQ").options)
        : [],
    });
  };

  const changeExamType = (type: FormState["type"]) => {
    setForm({ ...form, type });
    if (type !== "MIXED") {
      setQuestions((current) => current.map((item) => ({
        ...item,
        type,
        options: type === "MCQ"
          ? (item.options.length ? item.options : emptyQuestion("MCQ").options)
          : [],
      })));
    }
  };

  const addQuestion = () => {
    const preferredType = form.type === "CQ" ? "CQ" : "MCQ";
    setQuestions((current) => [...current, emptyQuestion(preferredType)]);
    setActiveQuestion(questions.length);
  };

  const removeQuestion = (index: number) => {
    if (questions.length === 1) return toast.error("An exam needs at least one question");
    setQuestions((current) => current.filter((_, questionIndex) => questionIndex !== index));
    setActiveQuestion((current) => Math.max(0, Math.min(current, questions.length - 2)));
  };

  const submit = async () => {
    const parsed = examFormSchema.safeParse(normalizeExamFormInput({
      ...form,
      proctorPolicy: form.examMode === "PRO" ? proctorPolicy : undefined,
      questions,
    }));
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const questionIndex = typeof issue?.path[1] === "number" && issue.path[0] === "questions"
        ? issue.path[1]
        : null;
      if (questionIndex !== null) setActiveQuestion(questionIndex);
      const field = issue?.path.length ? issue.path.map((part) =>
        typeof part === "number" ? part + 1 : part,
      ).join(" > ") : "";
      toast.error(`${field ? `${field}: ` : ""}${issue?.message ?? "Please review the exam details"}`);
      return;
    }
    setSaving(true);
    try {
      await examApi.create({
        ...parsed.data,
        startTime: new Date(parsed.data.startTime).toISOString(),
        endTime: new Date(parsed.data.endTime).toISOString(),
        questions: parsed.data.questions.map((question) => ({
          ...question,
          options: question.type === "CQ" ? [] : question.options,
        })),
      });
      toast.success("Exam submitted for admin approval");
      router.push("/dashboard/teacher/exams");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Could not create exam");
    } finally {
      setSaving(false);
    }
  };

  const question = questions[activeQuestion]!;

  return (
    <div className="mx-auto w-full max-w-7xl p-5 lg:p-8">
      <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/dashboard/teacher/exams" className="mb-3 inline-flex items-center gap-1 text-[11px] font-bold text-muted-foreground hover:text-teal-600"><RiArrowLeftLine /> ExamShield</Link>
          <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.16em] text-teal-600"><RiSparklingFill /> Creation studio</div>
          <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Design a trusted assessment.</h1>
          <p className="mt-2 max-w-2xl text-[13px] text-muted-foreground">A guided workflow for scheduling, question design, answer keys, and approval readiness.</p>
        </div>
        <button onClick={submit} disabled={saving} className="inline-flex h-11 items-center gap-2 rounded-xl bg-teal-600 px-5 text-[13px] font-bold text-white shadow-lg shadow-teal-600/20 disabled:opacity-50">
          {saving ? <RiLoader4Line className="animate-spin" /> : <RiShieldCheckLine />}
          Submit for approval
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-5">
          <Section icon={<RiInformationLine />} title="Exam identity" description="Give students clear context before they enter fullscreen mode.">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 md:col-span-2"><span className="text-[11px] font-bold">Exam title</span><input className={inputClass} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="e.g. Web Engineering Final Assessment" /></label>
              <label className="space-y-2"><span className="text-[11px] font-bold">Student cluster</span><select className={inputClass} value={form.clusterId} onChange={(event) => setForm({ ...form, clusterId: event.target.value })}><option value="">Select a cluster</option>{clusters.map((cluster) => <option key={cluster.id} value={cluster.id}>{cluster.name}</option>)}</select></label>
              <label className="space-y-2"><span className="text-[11px] font-bold">Assessment format</span><select className={inputClass} value={form.type} onChange={(event) => changeExamType(event.target.value as FormState["type"])}><option value="MCQ">MCQ</option><option value="CQ">Creative / long answer</option><option value="MIXED">Mixed</option></select></label>
              <label className="space-y-2 md:col-span-2"><span className="text-[11px] font-bold">Student instructions</span><textarea className={`${inputClass} min-h-24 resize-y`} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="What should students know before they begin?" /></label>
            </div>
          </Section>

          <Section icon={<RiTimeLine />} title="Secure exam window" description="Question submission and scheduling must be completed at least 24 hours before the start.">
            <div className="grid gap-4 md:grid-cols-3">
              <label className="space-y-2"><span className="text-[11px] font-bold">Starts at</span><input type="datetime-local" className={inputClass} value={form.startTime} onChange={(event) => setForm({ ...form, startTime: event.target.value })} /></label>
              <label className="space-y-2"><span className="text-[11px] font-bold">Ends at</span><input type="datetime-local" className={inputClass} value={form.endTime} onChange={(event) => setForm({ ...form, endTime: event.target.value })} /></label>
              <label className="space-y-2"><span className="text-[11px] font-bold">Duration (minutes)</span><input type="number" min={1} max={1440} className={inputClass} value={form.durationMinutes} onChange={(event) => setForm({ ...form, durationMinutes: Number(event.target.value) })} /></label>
            </div>
          </Section>

          <Section icon={<RiCameraLine />} title="ExamShield mode" description="Regular Mode uses the current browser integrity checks. Pro Mode adds consent, camera preflight, and local face-presence monitoring.">
            <div className="grid gap-3 md:grid-cols-2">
              {(["REGULAR", "PRO"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setForm({ ...form, examMode: mode })}
                  className={cn("rounded-2xl border p-4 text-left transition", form.examMode === mode ? "border-teal-500/50 bg-teal-500/10 shadow-sm" : "border-border bg-muted/15 hover:bg-muted/30")}
                >
                  <div className="flex items-center justify-between gap-3"><p className="text-[12px] font-black">{mode === "REGULAR" ? "Regular Mode" : "Pro Mode"}</p>{form.examMode === mode && <RiCheckLine className="text-teal-600" />}</div>
                  <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">{mode === "REGULAR" ? "No camera permission. Keeps fullscreen, tab, copy, paste, and page-exit monitoring." : "Requires informed consent and camera preflight. Camera frames stay on the student's device."}</p>
                </button>
              ))}
            </div>
            {form.examMode === "PRO" && (
              <div className="mt-4 rounded-2xl border border-teal-500/20 bg-teal-500/5 p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2"><span className="text-[11px] font-bold">Sensitivity</span><select className={inputClass} value={proctorPolicy.sensitivity} onChange={(event) => setProctorPolicy({ ...proctorPolicy, sensitivity: event.target.value as typeof proctorPolicy.sensitivity })}><option value="RELAXED">Relaxed</option><option value="STANDARD">Standard</option><option value="STRICT">Strict</option></select></label>
                  <label className="space-y-2"><span className="text-[11px] font-bold">Evidence retention</span><select className={inputClass} value={proctorPolicy.evidenceRetentionDays} onChange={(event) => setProctorPolicy({ ...proctorPolicy, evidenceRetentionDays: Number(event.target.value) as 7 | 30 | 90 })}><option value={7}>7 days</option><option value={30}>30 days</option><option value={90}>90 days</option></select></label>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <PolicyToggle label="Student warnings" checked={proctorPolicy.studentWarnings} onChange={(checked) => setProctorPolicy({ ...proctorPolicy, studentWarnings: checked })} />
                  <PolicyToggle label="Snapshot evidence" checked={proctorPolicy.snapshotEnabled} onChange={(checked) => setProctorPolicy({ ...proctorPolicy, snapshotEnabled: checked })} />
                  <PolicyToggle label="Rough paper allowed" checked={proctorPolicy.roughPaperAllowed} onChange={(checked) => setProctorPolicy({ ...proctorPolicy, roughPaperAllowed: checked })} />
                </div>
                <p className="mt-4 text-[10px] leading-relaxed text-muted-foreground">Pro Mode signals require teacher review and never automatically label a student as cheating. When enabled, sustained suspicious camera signals capture a compressed snapshot and store it as authenticated evidence for proctor review.</p>
              </div>
            )}
          </Section>

          <Section icon={<RiQuestionLine />} title="Question builder" description="Move between questions without losing context. Correct MCQ answers stay private.">
            <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
              {questions.map((item, index) => (
                <button key={index} onClick={() => setActiveQuestion(index)} className={cn("min-w-10 rounded-xl border px-3 py-2 text-[11px] font-extrabold transition", activeQuestion === index ? "border-teal-500 bg-teal-500/10 text-teal-700" : "border-border bg-muted/20 text-muted-foreground")}>
                  Q{index + 1}
                  <span className={cn("ml-1 inline-block h-1.5 w-1.5 rounded-full", item.prompt.trim() ? "bg-teal-500" : "bg-amber-400")} />
                </button>
              ))}
              <button onClick={addQuestion} className="min-w-10 rounded-xl border border-dashed border-teal-500/40 px-3 py-2 text-teal-600"><RiAddLine /></button>
            </div>

            <div className="rounded-2xl border border-border bg-muted/15 p-4 sm:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div><p className="text-[10px] font-extrabold uppercase tracking-widest text-teal-600">Question {activeQuestion + 1}</p><p className="mt-1 text-[11px] text-muted-foreground">Set the question, marks, and private answer key.</p></div>
                <button onClick={() => removeQuestion(activeQuestion)} className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600"><RiCloseLine /> Remove</button>
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
                <select className={inputClass} value={question.type} disabled={form.type !== "MIXED"} onChange={(event) => changeQuestionType(activeQuestion, event.target.value as Question["type"])}><option value="MCQ">Multiple choice</option><option value="CQ">Creative / long answer</option></select>
                <input type="number" min={0.5} step={0.5} className={inputClass} value={question.marks} onChange={(event) => updateQuestion(activeQuestion, { marks: Number(event.target.value) })} />
              </div>
              <textarea className={`${inputClass} mt-3 min-h-28 resize-y`} value={question.prompt} onChange={(event) => updateQuestion(activeQuestion, { prompt: event.target.value })} placeholder="Write a clear, unambiguous question..." />
              {question.type === "MCQ" && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {question.options.map((option, optionIndex) => (
                    <label key={optionIndex} className={cn("flex items-center gap-3 rounded-xl border p-3 transition", option.isCorrect ? "border-teal-500/40 bg-teal-500/8" : "border-border bg-card")}>
                      <input type="radio" checked={option.isCorrect} onChange={() => updateQuestion(activeQuestion, { options: question.options.map((item, index) => ({ ...item, isCorrect: index === optionIndex })) })} />
                      <input className="min-w-0 flex-1 bg-transparent text-[12px] outline-none" value={option.text} onChange={(event) => updateQuestion(activeQuestion, { options: question.options.map((item, index) => index === optionIndex ? { ...item, text: event.target.value } : item) })} placeholder={`Option ${optionIndex + 1}`} />
                      {option.isCorrect && <RiCheckLine className="text-teal-600" />}
                    </label>
                  ))}
                </div>
              )}
              <textarea className={`${inputClass} mt-4 min-h-20 resize-y`} value={question.explanation} onChange={(event) => updateQuestion(activeQuestion, { explanation: event.target.value })} placeholder="Optional explanation for post-exam review" />
            </div>
          </Section>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
          <div className="rounded-2xl border border-teal-500/20 bg-gradient-to-br from-teal-500/12 via-card to-card p-5 shadow-lg">
            <div className="flex items-center justify-between"><p className="text-[11px] font-extrabold uppercase tracking-widest text-teal-600">Approval readiness</p><span className="text-xl font-black text-teal-600">{readiness}%</span></div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-teal-500 transition-all" style={{ width: `${readiness}%` }} /></div>
            <div className="mt-5 space-y-3 text-[11px]">
              {[
                ["Identity complete", form.title.trim().length >= 3],
                ["Cluster selected", Boolean(form.clusterId)],
                ["Window scheduled", Boolean(form.startTime && form.endTime)],
                ["Questions ready", completeQuestions === questions.length],
              ].map(([label, ready]) => <p key={String(label)} className="flex items-center gap-2"><span className={cn("flex h-5 w-5 items-center justify-center rounded-full", ready ? "bg-teal-500/15 text-teal-600" : "bg-muted text-muted-foreground")}>{ready ? <RiCheckLine /> : "·"}</span>{label}</p>)}
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card/95 p-5">
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">Assessment summary</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-muted/40 p-3"><p className="text-xl font-black">{questions.length}</p><p className="text-[10px] text-muted-foreground">Questions</p></div>
              <div className="rounded-xl bg-muted/40 p-3"><p className="text-xl font-black">{totalMarks}</p><p className="text-[10px] text-muted-foreground">Total marks</p></div>
              <div className="rounded-xl bg-muted/40 p-3"><p className="text-xl font-black">{form.durationMinutes}</p><p className="text-[10px] text-muted-foreground">Minutes</p></div>
              <div className="rounded-xl bg-muted/40 p-3"><p className="text-xl font-black">{completeQuestions}</p><p className="text-[10px] text-muted-foreground">Ready</p></div>
            </div>
          </div>
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/8 p-4 text-[11px] leading-relaxed text-amber-800 dark:text-amber-200">
            <RiFileList3Line className="mb-2 text-lg" />
            Submitting sends the exam to admin approval. Approved exams cannot be edited.
          </div>
        </aside>
      </div>
    </div>
  );
}

function PolicyToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-card px-3 py-3 text-[10px] font-bold"><span>{label}</span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-teal-600" /></label>;
}
