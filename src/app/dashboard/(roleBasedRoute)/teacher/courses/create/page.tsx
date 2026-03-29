"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  RiSparklingFill, RiArrowLeftLine, RiAddLine, RiCloseLine,
  RiImageAddLine, RiBookOpenLine, RiPriceTag3Line,
  RiAlertLine, RiCheckLine, RiUploadLine, RiLoader4Line,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import { courseApi } from "@/lib/api";
import { toast } from "sonner";

const IMGBB_API_KEY = process.env.NEXT_PUBLIC_IMGBB_API_KEY ?? "";

async function uploadToImgbb(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("image", file);
  const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: "POST",
    body: fd,
  });
  if (!res.ok) throw new Error("Thumbnail upload failed");
  const payload = await res.json();
  if (!payload?.success || !payload?.data?.url) {
    throw new Error(payload?.error?.message ?? "Thumbnail upload failed");
  }
  return payload.data.url as string;
}

// ─── Ambient ──────────────────────────────────────────────
function AmbientBg() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(rgba(20,184,166,0.1) 1px,transparent 1px)", backgroundSize: "30px 30px" }} />
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-teal-500/[0.05] blur-[110px]" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-amber-500/[0.03] blur-[100px]" />
    </div>
  );
}

// ─── Tag Input ────────────────────────────────────────────
function TagInput({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [input, setInput] = useState("");
  const add = () => {
    const v = input.trim();
    if (v && !tags.includes(v) && tags.length < 8) { onChange([...tags, v]); setInput(""); }
  };
  return (
    <div className="flex flex-col gap-2">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <span key={tag} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-100/60 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/50 text-[12px] font-semibold text-teal-700 dark:text-teal-300">
              {tag}
              <button type="button" onClick={() => onChange(tags.filter(t => t !== tag))} className="text-teal-500 hover:text-teal-700 transition-colors"><RiCloseLine className="text-xs" /></button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder="Add tag and press Enter…" maxLength={24}
          className="flex-1 h-10 px-3.5 rounded-xl text-[13px] font-medium bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70 transition-all" />
        <button type="button" onClick={add} className="h-10 px-3.5 rounded-xl border border-border bg-muted/40 text-[13px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all">
          <RiAddLine />
        </button>
      </div>
      <p className="text-[11px] text-muted-foreground/60">{tags.length}/8 tags · Press Enter to add</p>
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────
function Section({ icon, title, description, children }: { icon: React.ReactNode; title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card/90 backdrop-blur-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
        <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center bg-teal-100/70 dark:bg-teal-950/50 border border-teal-200/60 dark:border-teal-800/50 text-teal-600 dark:text-teal-400 text-base">{icon}</div>
        <div>
          <h2 className="text-[14px] font-bold text-foreground leading-none mb-0.5">{title}</h2>
          {description && <p className="text-[12px] text-muted-foreground">{description}</p>}
        </div>
      </div>
      <div className="px-6 py-5 flex flex-col gap-4">{children}</div>
    </div>
  );
}

const iCls = "w-full h-11 px-4 rounded-xl text-[13.5px] font-medium bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70 transition-all";

// ─── Main ─────────────────────────────────────────────────
export default function CreateCoursePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isFree, setIsFree] = useState(true);
  const [requestedPrice, setRequestedPrice] = useState("");
  const [priceNote, setPriceNote] = useState("");
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const handleThumbnail = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onload = ev => setThumbnailPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = "Course title is required";
    if (!isFree && !requestedPrice) e.requestedPrice = "Enter a price for admin approval";
    if (!isFree && requestedPrice && parseFloat(requestedPrice) <= 0) e.requestedPrice = "Price must be greater than 0";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      let thumbnailUrl: string | undefined;
      if (thumbnailFile) {
        if (!IMGBB_API_KEY) {
          throw new Error("Missing NEXT_PUBLIC_IMGBB_API_KEY — add it to your frontend env for thumbnail uploads.");
        }
        thumbnailUrl = await uploadToImgbb(thumbnailFile);
      }
      const res = await courseApi.create({
        title: title.trim(),
        description: description.trim() || undefined,
        ...(thumbnailUrl ? { thumbnailUrl } : {}),
        tags,
        isFree,
        requestedPrice: isFree ? undefined : parseFloat(requestedPrice),
        priceNote: priceNote.trim() || undefined,
      });
      setCreatedId(res.data.id);
      setSuccess(true);
      toast.success("Course created successfully!", { position: "top-right" });
      setTimeout(() => router.push(`/dashboard/teacher/courses/${res.data.id}`), 1500);
    } catch (err: any) {
      setErrors({ general: err.message ?? "Something went wrong" });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="relative flex flex-col gap-6 p-5 lg:p-7 pt-6 max-w-2xl mx-auto w-full">
        <AmbientBg />
        <div className="rounded-2xl border border-border bg-card/90 backdrop-blur-sm p-12 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-teal-100/70 dark:bg-teal-950/50 border border-teal-200/60 dark:border-teal-800/50 flex items-center justify-center text-teal-600 dark:text-teal-400 text-2xl">
            <RiCheckLine />
          </div>
          <div>
            <h2 className="text-[18px] font-extrabold text-foreground mb-1">Course created!</h2>
            <p className="text-[13.5px] text-muted-foreground">Redirecting to the editor…</p>
          </div>
          <div className="w-6 h-6 border-2 border-teal-200 dark:border-teal-800 border-t-teal-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="relative flex flex-col gap-6 p-5 lg:p-7 pt-6 max-w-3xl mx-auto w-full">
        <AmbientBg />

        {/* Heading */}
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <RiSparklingFill className="text-teal-500 dark:text-teal-400 text-sm animate-pulse" />
            <span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">Courses</span>
          </div>
          <h1 className="text-[1.5rem] font-extrabold tracking-tight text-foreground leading-none">Create a new course</h1>
          <p className="text-[13.5px] text-muted-foreground mt-1">Fill in the details. Your course saves as a draft and needs admin approval to publish.</p>
        </div>

        {errors.general && (
          <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50">
            <RiAlertLine className="text-red-500 text-base mt-0.5 flex-shrink-0" />
            <p className="text-[13px] font-medium text-red-600 dark:text-red-400">{errors.general}</p>
          </div>
        )}

        {/* Thumbnail */}
        <Section icon={<RiImageAddLine />} title="Course Thumbnail" description="A compelling thumbnail increases enrollment by up to 40%.">
          {thumbnailPreview ? (
            <div className="relative rounded-xl overflow-hidden h-48 group">
              <img src={thumbnailPreview} alt="Preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              <button type="button" onClick={() => { setThumbnailPreview(null); setThumbnailFile(null); }}
                className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors opacity-0 group-hover:opacity-100">
                <RiCloseLine />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center h-48 rounded-xl border-2 border-dashed border-border hover:border-teal-400/60 dark:hover:border-teal-600/60 cursor-pointer transition-all duration-200 bg-muted/10 hover:bg-teal-50/20 dark:hover:bg-teal-950/10 group">
              <div className="w-10 h-10 rounded-xl bg-muted/40 border border-border flex items-center justify-center text-muted-foreground/40 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors mb-2">
                <RiUploadLine className="text-lg" />
              </div>
              <p className="text-[13px] font-semibold text-muted-foreground group-hover:text-foreground transition-colors">Click to upload thumbnail</p>
              <p className="text-[11.5px] text-muted-foreground/60 mt-1">PNG, JPG up to 4MB · Recommended 16:9</p>
              <input type="file" accept="image/*" onChange={handleThumbnail} className="hidden" />
            </label>
          )}
        </Section>

        {/* Details */}
        <Section icon={<RiBookOpenLine />} title="Course Details" description="Basic information about your course.">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12.5px] font-bold text-muted-foreground">Course title <span className="text-red-500">*</span></label>
            <input value={title} onChange={e => { setTitle(e.target.value); setErrors(p => ({ ...p, title: "" })); }}
              placeholder="e.g. Deep Learning Fundamentals"
              className={cn(iCls, errors.title && "border-red-400/60 dark:border-red-500/50")} />
            {errors.title && <p className="text-[12px] text-red-500 font-medium">{errors.title}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12.5px] font-bold text-muted-foreground">Description</label>
            <textarea rows={4} value={description} onChange={e => setDescription(e.target.value)}
              placeholder="What will students learn? Who is this course for?"
              className="w-full px-4 py-3 rounded-xl text-[13.5px] font-medium leading-relaxed resize-none bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70 transition-all" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12.5px] font-bold text-muted-foreground">Tags</label>
            <TagInput tags={tags} onChange={setTags} />
          </div>
        </Section>

        {/* Pricing */}
        <Section icon={<RiPriceTag3Line />} title="Pricing" description="Set a price or offer it for free. Pricing requires admin approval.">
          <div className="grid grid-cols-2 gap-3">
            {[{ v: true, l: "Free", s: "Anyone can enroll at no cost" }, { v: false, l: "Paid", s: "Requires admin price approval" }].map(opt => (
              <div key={String(opt.v)} onClick={() => setIsFree(opt.v)}
                className={cn("flex flex-col gap-1 px-4 py-3.5 rounded-xl cursor-pointer border transition-all",
                  isFree === opt.v ? "border-teal-300/60 dark:border-teal-700/50 bg-teal-50/40 dark:bg-teal-950/20" : "border-border bg-muted/30 hover:bg-muted/50")}>
                <div className="flex items-center justify-between">
                  <p className={cn("text-[13.5px] font-bold", isFree === opt.v ? "text-teal-700 dark:text-teal-300" : "text-foreground")}>{opt.l}</p>
                  <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", isFree === opt.v ? "border-teal-500 bg-teal-500" : "border-border")}>
                    {isFree === opt.v && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <p className="text-[11.5px] text-muted-foreground">{opt.s}</p>
              </div>
            ))}
          </div>

          {!isFree && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12.5px] font-bold text-muted-foreground">Requested price (USD) <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">$</span>
                  <input type="number" min="0.99" step="0.01" value={requestedPrice}
                    onChange={e => { setRequestedPrice(e.target.value); setErrors(p => ({ ...p, requestedPrice: "" })); }}
                    placeholder="0.00" className={cn(iCls, "pl-8", errors.requestedPrice && "border-red-400/60 dark:border-red-500/50")} />
                </div>
                {errors.requestedPrice && <p className="text-[12px] text-red-500 font-medium">{errors.requestedPrice}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12.5px] font-bold text-muted-foreground">Price justification</label>
                <textarea rows={2} value={priceNote} onChange={e => setPriceNote(e.target.value)}
                  placeholder="Explain why this price is appropriate for the content…"
                  className="w-full px-4 py-2.5 rounded-xl text-[13px] font-medium resize-none bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70 transition-all" />
              </div>
              <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/50">
                <RiAlertLine className="text-amber-500 text-sm mt-0.5 flex-shrink-0" />
                <p className="text-[12px] text-amber-700 dark:text-amber-400 leading-relaxed">Admin approval required. Your course launches as free until the price is approved.</p>
              </div>
            </div>
          )}
        </Section>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <button type="button" onClick={() => router.back()} className="h-10 px-5 rounded-xl border border-border text-[13.5px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all">Cancel</button>
          <button type="submit" disabled={loading}
            className={cn("inline-flex items-center gap-2 h-10 px-7 rounded-xl bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-600 text-white text-[14px] font-bold shadow-md shadow-teal-600/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100")}>
            {loading ? <RiLoader4Line className="animate-spin" /> : <RiAddLine />}
            {loading ? "Creating…" : "Create course"}
          </button>
        </div>
      </div>
    </form>
  );
}