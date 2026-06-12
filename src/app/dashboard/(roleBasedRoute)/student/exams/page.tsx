"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RiCheckboxCircleLine, RiShieldCheckLine, RiTimeLine } from "react-icons/ri";
import { toast } from "sonner";
import { examApi } from "@/lib/api";

export default function StudentExamsPage() {
  const [items, setItems] = useState<any[]>([]); const [loading, setLoading] = useState(true); const router = useRouter();
  const load = useCallback(async () => { try { setItems((await examApi.studentList()).data ?? []); } catch (e: any) { toast.error(e.message); } finally { setLoading(false); } }, []); useEffect(() => { load(); }, [load]);
  return <div className="p-5 lg:p-8 max-w-5xl mx-auto flex flex-col gap-6"><div><div className="text-[10px] tracking-[.14em] uppercase font-bold text-teal-600 flex gap-2 items-center"><RiShieldCheckLine /> ExamShield</div><h1 className="text-2xl font-extrabold mt-1">My exams</h1><p className="text-[13px] text-muted-foreground">Your approved cluster exam schedule.</p></div>{loading ? <div className="h-40 rounded-2xl bg-muted animate-pulse" /> : <div className="space-y-3">{items.map(({ exam }: any) => { const active = Date.now() >= new Date(exam.startTime).getTime() && Date.now() < new Date(exam.endTime).getTime(); return <div key={exam.id} className="rounded-2xl border border-border bg-card p-5 flex gap-4 items-center"><div className="w-11 h-11 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center"><RiShieldCheckLine /></div><div className="flex-1"><h3 className="font-extrabold text-[14px]">{exam.title}</h3><p className="text-[12px] text-muted-foreground">{exam.cluster.name} · {exam.type} · {exam._count.questions} questions</p><p className="text-[11px] mt-2 flex gap-1 items-center text-muted-foreground"><RiTimeLine />{new Date(exam.startTime).toLocaleString()} to {new Date(exam.endTime).toLocaleString()}</p></div><button disabled={!active} onClick={() => router.push(`/dashboard/student/exams/${exam.id}`)} className="h-10 px-4 rounded-xl bg-teal-600 text-white disabled:bg-muted disabled:text-muted-foreground text-[12px] font-bold flex gap-2 items-center">{active ? <><RiShieldCheckLine />Enter exam</> : <><RiCheckboxCircleLine />Scheduled</>}</button></div>; })}{!items.length && <div className="py-20 text-center text-muted-foreground">No approved exams scheduled.</div>}</div>}</div>;
}
