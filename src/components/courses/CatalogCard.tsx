import {
 RiBookOpenLine, RiGroupLine,
  RiStarFill,  RiArrowRightLine,
  RiFileTextLine, 
} from "react-icons/ri";
import { cn } from "@/lib/utils";


const fmtUSD = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);


export function CatalogCard({ course, onClick }: { course: any; onClick: () => void }) {
  return (
    <div onClick={onClick} className={cn(
      "group relative rounded-2xl border border-border bg-card/90 backdrop-blur-sm overflow-hidden cursor-pointer",
      "hover:border-teal-300/50 dark:hover:border-teal-700/40",
      "hover:shadow-2xl hover:shadow-teal-600/[0.07]",
      "transition-all duration-300 ease-out"
    )}>
      <div className="absolute top-0 inset-x-0  bg-gradient-to-r from-transparent via-teal-400/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />

      <div className="relative h-60 aspect-[16/9] bg-gradient-to-br from-teal-950/80 via-slate-900 to-slate-950 overflow-hidden">
        {course.thumbnailUrl
          ? <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover opacity-75 group-hover:opacity-90 group-hover:scale-[1.03] transition-all duration-500 ease-out" />
          : <div className="w-full h-full flex items-center justify-center relative">
              <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "linear-gradient(rgba(20,184,166,1) 1px,transparent 1px),linear-gradient(90deg,rgba(20,184,166,1) 1px,transparent 1px)", backgroundSize: "20px 20px" }} />
              <RiBookOpenLine className="text-5xl text-teal-700/20 relative z-10" />
            </div>
        }
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
          {course.tags?.slice(0, 2).map((t: string) => <span key={t} className="px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-md text-[10.5px] font-semibold text-white/80 border border-white/10">{t}</span>)}
        </div>
        {course.isFeatured && <span className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/90 text-[10.5px] font-bold text-white"><RiStarFill className="text-xs" />Featured</span>}
        <div className="absolute bottom-3 left-3">
          <span className={cn("px-2.5 py-1 rounded-lg text-[12px] font-extrabold backdrop-blur-sm border", course.isFree ? "bg-teal-500/20 text-teal-300 border-teal-500/30" : "bg-black/50 text-white border-white/20")}>
            {course.isFree ? "Free" : fmtUSD(course.price)}
          </span>
        </div>
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">
        <div>
          <h3 className="text-[14px] font-extrabold text-foreground leading-snug line-clamp-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">{course.title}</h3>
          {course.description && <p className="text-[12.5px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{course.description}</p>}
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-border/60">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5"><RiGroupLine className="text-xs text-teal-600 dark:text-teal-400" /><span className="text-[12px] font-bold text-foreground">{course._count?.enrollments ?? 0}</span><span className="text-[11px] text-muted-foreground">students</span></span>
            <span className="flex items-center gap-1.5"><RiFileTextLine className="text-xs text-teal-600 dark:text-teal-400" /><span className="text-[12px] font-bold text-foreground">{course._count?.missions ?? 0}</span><span className="text-[11px] text-muted-foreground">missions</span></span>
          </div>
        </div>
        <div className="w-full h-9 rounded-xl flex items-center justify-center gap-2 border border-border text-[12.5px] font-semibold text-muted-foreground bg-muted/20 group-hover:text-teal-600 dark:group-hover:text-teal-400 group-hover:border-teal-300/50 dark:group-hover:border-teal-700/50 group-hover:bg-teal-50/30 dark:group-hover:bg-teal-950/20 transition-all">
          View course <RiArrowRightLine className="text-xs group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  );
}

